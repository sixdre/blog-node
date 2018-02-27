/*
 * 评论控制器（
 */
"use strict";
import _ from 'underscore'
import {ArticleModel,CommentModel} from '../models/'

export default class CommentObj{

	async getComments(req, res, next) {
		let articleId = req.params['article_id'];
		let { order_by, page = 1 ,pageSize = 10} = req.query;
		let sort = { likeNum: -1 }
		if(order_by == "timeSeq") {
			sort = { create_time: 1 }
		} else if(order_by == "timeRev") {
			sort = { create_time: -1 }
		}
		try {
			let article = await ArticleModel.findById(articleId);
			if(!article){
				return res.json({
					code:0,
					message:'该文章不存在或已被删除'
				})
			}
			const results = await CommentModel.getListToPage({articleId:articleId},page,pageSize,sort)
			res.json({
				code:1,
				msg:'评论获取成功',
				data: results.data,
				total:results.total,
				pageSize
			})
		} catch(err) {
			console.log(err);
			return next(err);
		}
	}

	async addComment(req, res, next) {
		let _comment = req.body;
		if(_.isEmpty(_comment.content)){
			return res.json({
				code:0,
				message:'请输入内容'
			})
		}
		try{
			const articleId=req.params['article_id'];
			const fromId = req.userInfo;
			let article = await ArticleModel.findOne({_id:articleId,is_private:false});
			if(!article){
				return res.json({
					code:0,
					message:'该文章不存在或已被删除'
				})
			}
			if(_comment.cId) {		//说明是回复评论
				if(_.isEmpty(_comment.toId)){
					return res.json({
						code:0,
						message:'参数缺失'
					})
				}
				let cmt = await CommentModel.findById(_comment.cId);
				if(!cmt){
					return res.json({
						code:0,
						message:'此条评论不存在'
					})
				}
				let reply = {
					from: fromId,
					to: _comment.toId,
					content: _comment.content,
					create_time:Date.now()
				};
				await CommentModel.reply(_comment.cId,articleId,reply);
				res.json({
					code: 1,
					message:'评论成功'
				});
			}else{
				_comment.articleId = articleId;
				let newcomment = new CommentModel({
					articleId:articleId,
					from:fromId,
					content:_comment.content
				});
				await newcomment.save();
				res.json({
					code: 1,
					message:'评论成功'
				});
			}
		}catch(err){
			console.log('评论出错:' + err);
			return 	next(err);
		}
	}

	async addCommentLike(req, res, next) {
		const commentId = req.params['comment_id'],
			user = req.userInfo;

		try {
			let comment = await CommentModel.findById(commentId);
			if(!comment) {		//没有在主评论找到的话就去回复中查询
				let data = await CommentModel.findOne({'reply._id':commentId});
				if(!data){
					return res.json({
						code:0,
						message:'没有找到该评论'
					})
				}
				let reply = data.reply;
				reply.forEach((value) =>{
					if(value._id == commentId) {
						if(value.likes.indexOf(user._id) > -1) {
							return res.json({
								code: 0,
								message: '您已点赞'
							})
						}
						value.likes.push(user._id);
					}
				});
				await data.save();
				res.json({
					code: 1,
					message: '点赞成功'
				});
				
			}else{
				if(comment.likes.indexOf(user._id) > -1) {
					return res.json({
						code: 0,
						message: '您已点赞'
					});
				}
				comment.likes.push(user._id);
				await comment.save();
				res.json({
					code: 1,
					message: '点赞成功'
				});
			}
		} catch(err) {
			console.log('评论点赞出错:' + err);
			return 	next(err);
		}
	}

}

