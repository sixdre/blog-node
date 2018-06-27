/*
 * 评论控制器（
 */
"use strict";
import _ from 'underscore'
import {ArticleModel,CommentModel} from '../../models/'
import validator from 'validator'


function checkIsLike(data,userId){
	var result = [];
	for(var i=0;i<data.length;i++){
		var item = JSON.parse(JSON.stringify(data[i])) 
		item.likes = item.likes.map(i=>String(i));
		if(item.likes.indexOf(userId)!=-1){
			item.isLike = true;
		}else{
			item.isLike = false;
		}
		if(item.reply&&item.reply.length){
			item.reply = checkIsLike(item.reply,userId);
		}
		result.push(item)
	}
	return result;
}


export default class CommentObj{
	/*
	 *	获取文章评论
	*/
	async getCommentsByArticleId(req, res, next) {
		let articleId = req.params['article_id'];
		if (!validator.isMongoId(articleId)) {
			res.retErrorParams('文章ID参数错误')
			return 
		}
		let { order_by, page = 1 ,limit = 10} = req.query;
		let sort = { likes: -1 }
		if(order_by == "timeSeq") {
			sort = { create_time: 1 }
		} else if(order_by == "timeRev") {
			sort = { create_time: -1 }
		}
		try {
			let article = await ArticleModel.findById(articleId);
			if(!article){
				return res.retError('该文章不存在或已被删除');
			}
			const results = await CommentModel.getListToPage({articleId:articleId},page,limit,sort);
			const cmt_all_num = await CommentModel.count({articleId:articleId});
			const comment_users = await CommentModel.aggregate([	//统计对改文章下评论的用户数量
							{ $match:{'articleId':article._id}},
							{ $group:{ _id: "$from",count:{ $sum: 1 } }}]);


			//如果用户已登录需要把评论的点赞情况isLike 返回前台
			if(req.userInfo&&results.data.length>0){
				results.data = checkIsLike(results.data,req.userInfo._id)
			}

			res.retSuccess({
				user_num:comment_users.length,			//评论该文章的用户数量
				cmt_all_num,			//评论该文章的总回复包括回复的回复
				data: results.data,
				total:results.total,
				limit:results.limit,
				page:results.page,
				current_userId:req.userInfo?req.userInfo._id:null
			})
		} catch(err) {
			console.log(err);
			return next(err);
		}
	}

	async addComment(req, res, next) {
		let _comment = req.body;
		const articleId=req.params['article_id'];
		const fromId = req.userInfo._id;
		try{
			if (validator.isEmpty(_comment.content)) {
				throw new Error('请输入内容')
			}else if(!validator.isMongoId(articleId)){
				throw new Error('articleId参数错误')
			}else if(!validator.isMongoId(fromId)){
				throw new Error('fromId参数错误')
			}
		}catch(err){
			console.log(err.message);
			res.retErrorParams(err.message)
			return
		}
		try{
			let article = await ArticleModel.findOne({_id:articleId,is_private:false});
			if(!article){
				return res.retError('该文章不存在或已被删除')
			}

			if(validator.isEmpty(_comment.cId)||!_comment.cId){
				let newcomment = new CommentModel({
					articleId:articleId,
					from:fromId,
					content:_comment.content
				})
				await newcomment.save();
				res.retSuccess();
			}else if(validator.isMongoId(_comment.cId)&&validator.isMongoId(_comment.toId)){	//说明是回复评论
				let cmt = await CommentModel.findById(_comment.cId);
				if(!cmt){
					return res.retError('此条评论不存在');
				}
				let reply = await new CommentModel({
							articleId:articleId,
							from: fromId,
							to: _comment.toId,
							content: _comment.content,
							isM:_comment.isM
						}).save();
				await CommentModel.reply(_comment.cId,articleId,reply._id);
				res.retSuccess();
			}else{
				res.retErrorParams('参数错误')
			}
		}catch(err){
			console.log('评论出错:' + err);
			return 	next(err);
		}
	}

	async removeMe(req,res,next){
		const cid = req.params['id'];
		const userId = req.userInfo._id;
		if(!validator.isMongoId(cid)){
			return res.retErrorParams('参数错误')
		}
		try{
			let comment = await CommentModel.findById(cid);
			if(!comment){
				return res.retError('该评论不存在')
			}
			await CommentModel.remove({_id: cid,from:userId});
			await ArticleModel.update({_id:comment.articleId},{'$inc':{'cmt_num':-1}})
			res.retSuccess()
		}catch(err){
			console.log('操作失败:'+err);
			return next(err);
		}
	}



	async toggleCommentLike(req, res, next) {
		const commentId = req.params['comment_id'],
			userId = req.userInfo._id;
		try{
			if(!validator.isMongoId(commentId)){
				throw new Error('commentId参数错误')
			}
		}catch(err){
			console.log(err.message);
			return res.retErrorParams(err.message)
		}
		try{
			let comment = await CommentModel.findById(commentId);
			if(!comment) {		//没有在主评论找到的话就去回复中查询
				return res.retError('没有找到该评论')
			}
			let condition,isLike,count=0;
			if(comment.likes.indexOf(userId) !== -1){
				condition = {'$pull':{'likes':userId}};
			  	count = comment.likes.length-1;
			  	isLike = false;
			}else{
				condition = {'$addToSet':{'likes':userId}};
			  	count = comment.likes.length+1;
			  	isLike = true;
			}
			await CommentModel.update({ _id: commentId}, condition);
			res.retSuccess({
				count:count,
				isLike:isLike,
			});
		}catch(err){
			console.log('操作失败:'+err);
			return next(err);
		}

	}

}

