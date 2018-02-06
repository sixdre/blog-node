/*
 * 文章控制器（文章发布，查询，删除）
 */
"use strict";
import _ from 'underscore'
import request from 'request'
import {ArticleModel,CategoryModel,CommentModel,TagModel} from '../models/'
import UploadComponent from '../prototype/upload'

const tool = require('../utility/tool');

class ArticleObj extends UploadComponent{
	constructor() {
		super()
		this.create = this.create.bind(this)
	}
	//获取文章
	async get(req, res, next) {
		let { page = 1, limit = 10, title = "", flag = 2 } = req.query;
		page = parseInt(page);
		limit = parseInt(limit);
		flag = parseInt(flag);
		let queryObj={
			page,
			limit,
			flag,
			title
		}
		try{
			let {articles,totalPage,total} = await ArticleModel.findList(queryObj);
			// request('http://47.93.52.132:7893/api/articles', function (error, response, body) {
			//   	if (!error && response.statusCode == 200) {
			//   		let data = JSON.parse(body);
			//   		data.data = data.articles;
			//     	res.json(data);
			//   	}
			// })
			
			res.json({
				code:1,
				data:articles,
				total:total,			//文章总数
                totalPage:totalPage,		//总计页数
                page       
			});
		}catch(err){
			console.log('获取文章列表出错:' + err);
			return next(err);
		}
	}
	//根据id获取文章
	async findOneById(req, res, next) {
		let id = req.params['id'];
		let pv = req.query.pv;
		try{
			let article = await ArticleModel.findById(id,{content:0,__v:0})
								.populate('category','name').populate('tags','name')
								.populate('likes','name');
			if(!article||article.status==0){
				return res.json({
					code: 0,
					message: '文章不存在或已被删除'
				});
			}
			if(pv){
				await ArticleModel.update({_id:id}, {'$inc': {'nums.pv': 1}});
			}
			res.json({
				code: 1,
				data:article,
				message: 'success'
			});
		}catch(err){
			console.log('获取文章出错',+err);
			return next(err);
		}
	}

	async getArticlesByTagId(req,res,next){
		let tagId = req.params['tag_id'];
		const {offset=0,limit = 100} = req.query;
		try{
			let articles = await ArticleModel.find({'tags':{'$in':[tagId]}},{content:0,tagcontent:0,__v:0})
								.skip(Number(offset)).limit(Number(limit))
								.populate('category','name')
								.populate('tags','name').populate('likes','name');		
			res.json({
				code:1,
				msg:'success',
				data:articles
			});
		}catch(err){
			console.log('获取文章出错'+err);
			return next(err);
		}
	}
	
	async getArticlesByCategoryId(req,res,next){
		const cId = req.params['category_id'];
		const {offset=0,limit = 100} = req.query;
		try{
			let articles = await ArticleModel.find({'category':{'$in':[cId]}},{'content':0,'tagcontent':0,'__v':0})
							.skip(Number(offset)).limit(Number(limit))
							.populate('category','name')
							.populate('tags','name').populate('likes','name');		
			res.json({
				code:1,
				msg:'success',
				data:articles
			});
		}catch(err){
			console.log('获取文章出错'+err);
			return next(err);
		}
	}
	
	async create(req, res, next) {
		const id = req.params['id'];
		let article = req.body.article;
		// let msg = '';
		// if(!Array.isArray(article.tags)||!article.tags.length){
		// 	msg
		// }
		try {
			//检查tag如果已有tag就查询获取tagid否则创建新的tag
			let Pro = article.tags.map((item)=>{
				return new Promise(function(resolve, reject){
					TagModel.findOne({name:item}).then(function(d){
						if(d){
							resolve(d._id)
						}else{
							TagModel.create({name:item}).then(function(newTag){
								resolve(newTag._id);
							})
						}
					}).catch(function(err){
						reject(err)
					})
				})
			})
			
			article.tags = await Promise.all(Pro);

			//检查category如果已有category就查询获取categoryid否则创建新的category
			let ncate = await CategoryModel.findOne({name:article.category});
			if(!ncate){
				let dcate = await CategoryModel.create({name:article.category});
				article.category = dcate._id;
			}else{
				article.category = ncate._id;
			}

			let rart = await ArticleModel.findOne({title:article.title});
			if(rart){
				return res.json({
					code: 0,
					message: '文章标题已存在'
				})
			}
			if(req.file) {
				let nameArray = req.file.originalname.split('.')
				let type = nameArray[nameArray.length - 1];
				if(!tool.checkUploadImg(type)) {
					return res.json({
						code: 0,
						message: '文章封面格式错误'
					})
				}
				let imgurl = await this.upload(req.file);
				article.img = imgurl;
			}
			if(!article.abstract||!article.abstract.length){
				article.abstract = article.content.substring(0,50);
			}


			if(id){		//更新
				let barticle = await ArticleModel.findById(id);
				let _article = _.extend(barticle, article);
				await _article.save();
			}else{	//新增
				await new ArticleModel(article).save();
				// await CategoryModel.update({ '_id': newarticle.category }, { '$addToSet': { "articles": newarticle._id } });
			}

			res.json({
				code: 1,
				message: '发布成功'
			});
		} catch(err) {
			console.log('文章发布出错' + err);
			return next(err);
		}
	}

	

	async removeOne(req, res, next) {
		const id = req.params['id'];
		try {
			let article = await ArticleModel.findById(id);
			if(!article){
				return res.json({
					code:0,
					message:'该文章不存在或已被删除'
				})
			}
			await CategoryModel.update({ _id: article.category }, { $pull: { "articles": id } });
			if(!article.status) {
				await ArticleModel.remove({ _id: id });
			}else{
				await ArticleModel.update({ _id: id }, { 'status': 0 });
			}
			res.json({
				code: 1,
				message: '删除成功'
			});
		} catch(err) {
			console.log('删除文章出错' + err);
			return next(err);
		}
	}

	async remove(req, res, next) {
		const ids = req.params['id'].split(',');
		try{
			let articles = await ArticleModel.find({ _id: { "$in": ids } });
			let pro = articles.map((article) =>{
				return new Promise(function(resolve, reject){
					return  CategoryModel.update({
						_id: article.category
					}, {
						$pull: {
							"articles": article._id
						}
					}).then(function(){
						if(!article.status) { //彻底删除
							return ArticleModel.remove({
								_id: article._id
							});
						} else { 			//（假删除）
							return ArticleModel.update({
								_id: article._id
							}, {
								'status': 0
							});
						}
					}).then(function(){
						resolve('ok')
					}).catch(function(err){
						reject(err)
					})
				})
			})
			
			await Promise.all(pro);
			res.json({
				code: 1,
				message: '删除成功'
			});
			
		}catch(err){
			console.log('文章批量删除失败:' + err);
			return next(err);
		}

	}

	async addLikes(req, res, next) {
		let id = req.params['id'];
		let userId = req.session["User"]._id;
		if(!userId) {
			res.json({
				code: 0,
				type: 'ERROR_PARAMS',
				message: '参数错误'
			});
			return;
		}
		try{
			let article = await ArticleModel.findById(id);
			if(!article){
				return res.json({
					code:0,
					message:'该文章不存在或已被删除'
				})
			}
			await ArticleModel.update({ _id: id}, { $addToSet: { "likes": userId } });
			res.json({
				code: 1,
				type: 'SUCCESS_TO_ADD_LIKES',
				message: '点赞成功'
			});
		}catch(err){
			console.log('点赞失败:'+err);
			return next(err);
		}
	}

	async getComments(req, res, next) {
		let articleId = req.params['article_id'];
		let { order_by, page = 1 } = req.query;
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
			const comments = await CommentModel.find({ articleId: articleId })
				.populate({
					path:'from reply.from reply.to',
					select:'username '
				}).sort(sort);

			res.json({
				code:1,
				msg:'评论获取成功',
				data: comments
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
			let article = await ArticleModel.findById(articleId);
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
				await CommentModel.update({ _id: _comment.cId }, { $addToSet: { "reply": reply } });
				await ArticleModel.update({_id:articleId},{'$inc':{'nums.cmtNum':1}});
				res.json({
					code: 1,
					message:'评论成功'
				});
			}else{
				_comment.create_time = new Date();
				_comment.articleId = articleId;
				let newcomment = new CommentModel({
					articleId:articleId,
					from:fromId,
					content:_comment.content,
					create_time:Date.now()
				});
				await newcomment.save();
				await ArticleModel.update({_id:articleId},{'$inc':{'nums.cmtNum':1}});
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
					message: '点赞更新成功'
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
					message: '点赞更新成功'
				});
			}
		} catch(err) {
			console.log('评论点赞出错:' + err);
			return 	next(err);
		}
	}
}

export default new ArticleObj();