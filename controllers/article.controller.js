/*
 * 文章控制器（文章发布，查询，删除）
 */
"use strict";
import _ from 'underscore'

import {ArticleModel,CategoryModel,CommentModel} from '../models/'
import UploadComponent from '../prototype/upload'

const tool = require('../utility/tool');

class ArticleObj extends UploadComponent{
	constructor() {
		super()
		this.create = this.create.bind(this)
		this.update = this.update.bind(this)
	}
	//获取文章
	async getArticles(req, res, next) {
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
		try{
			let article = await ArticleModel.findById(id,{content:0,__v:0})
								.populate('category','name').populate('tags','name');
			if(!article||article.status==0){
				return res.json({
					code: 0,
					message: '文章不存在或已被删除'
				});
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
								.populate('category','name').populate('tags','name');			
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
							.populate('category','name').populate('tags','name');
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
		let article = req.body.article;
		article['author'] = req.userInfo.username || '未知用户';
		try {
			if(req.file) {
				let nameArray = req.file.originalname.split('.')
				let type = nameArray[nameArray.length - 1];
				if(!tool.checkUploadImg(type)) {
					return res.json({
						code: 0,
						message: '文章封面格式错误'
					})
				}
				let imgurl = await this.upload(req);
				article.img = imgurl;
			}
			if(!article.abstract||!article.abstract.length){
				article.abstract = article.content.substring(0,50);
			}
			let newarticle = await new ArticleModel(article).save();

			await CategoryModel.update({ '_id': newarticle.category }, { '$addToSet': { "articles": newarticle._id } });
			res.json({
				code: 1,
				message: '发布成功'
			});
		} catch(err) {
			console.log('文章发布出错' + err);
			return next(err);
		}
	}

	async update(req, res, next) {
		const id = req.params['id'];
		let newArticle = req.body.article;

		try {
			if(req.file) {
				let nameArray = req.file.originalname.split('.')
				let type = nameArray[nameArray.length - 1];
				if(!tool.checkUploadImg(type)) {
					return res.json({
						code: 0,
						message: '文章封面格式错误'
					})
				}
				let imgurl = await this.upload(req);
				newArticle.img = imgurl;
			}
			if(!newArticle.abstract||!newArticle.abstract.length){
				newArticle.abstract = newArticle.content.substring(0,50);
			}
			let article = await ArticleModel.findById(id);
			let _article = _.extend(article, newArticle);
			await _article.save();
			res.json({
				code: 1,
				message: '更新成功'
			});
		} catch(err) {
			console.log('更新文章失败:' + err);
			return next(err);
		}
	}

	async updatePv(req,res,next){
		const id = req.params['id'];
		console.log(id)
		try{
			await ArticleModel.update({_id:id}, {'$inc': {'nums.pv': 1}});
			res.json({
				code: 1,
				message: '更新pv成功'
			});
		}catch(err){
			console.log('更新pv失败');
			return next(err);
		}

	}


	async removeOne(req, res, next) {
		const id = req.params['id'];
		try {
			let article = await ArticleModel.findById(id);
			if(!article){
				return res.json({
					code:-1,
					message:'没有找到要删除的文章'
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
		if(!id || !userId) {
			res.json({
				code: 0,
				type: 'ERROR_PARAMS',
				message: '参数错误'
			});
			return;
		}
		try{
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
			const comments = await CommentModel.find({ articleId: articleId })
				.populate({
					path:'from reply.from reply.to',
					select:'username '
				})
				.sort(sort);
			res.json({
				data: comments
			})
		} catch(err) {
			console.log(err);
			return next(err);
		}
	}

	async addComment(req, res, next) {
		let _comment = req.body;
		const articleId=req.params['article_id'];
		_comment.from = req.session["User"];
		if(_comment.cId) {
			let reply = {
				from: _comment.from._id,
				to: _comment.toId,
				content: _comment.content,
				create_time: new Date()
			};
			try {
				await CommentModel.update({ _id: _comment.cId }, { $addToSet: { "reply": reply } });
				await ArticleModel.update({_id:articleId},{'$inc':{'nums.cmtNum':1}});
				res.json({
					code: 1,
					message:'评论成功'
				});
			} catch(err) {
				console.log('评论出错:' + err);
				return 	next(err);
			}
		} else {
			_comment.create_time = new Date();
			_comment.articleId = articleId;
			let newcomment = new CommentModel(_comment);
			try {
				await newcomment.save();
				await ArticleModel.update({_id:articleId},{'$inc':{'nums.cmtNum':1}});
				res.json({
					code: 1,
					message:'评论成功'
				});
			} catch(err) {
				console.log('评论出错:' + err);
				return 	next(err);
			}
		}
	}

	async addCommentLike(req, res, next) {
		const commentId = req.params['comment_id'],
			replyId = req.body.replyId,
			user = req.session['User'];

		try {
			let comment = await CommentModel.findById(commentId);
			if(!comment) {
				res.json({
					code: 0,
					message: '操作失败，没有找到该评论！'
				});
				return;
			}
			if(!replyId) { //评论点赞
				if(comment.likes.indexOf(user._id) > -1) {
					return res.json({
						code: -2,
						message: '您已点赞'
					});
				}
				comment.likes.push(user._id);
				await comment.save();
				res.json({
					code: 1,
					message: '点赞更新成功'
				});
			} else {
				let reply = comment.reply;
				reply.forEach((value) =>{
					if(value._id == replyId) {
						if(value.likes.indexOf(user._id) > -1) {
							return res.json({
								code: -2,
								message: '您已点赞'
							})
						}
						value.likes.push(user._id);
					}
				});
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