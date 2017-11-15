/*
 * 文章控制器（文章发布，查询，删除）
 */
"use strict";
import _ from 'underscore'

import ArticleModel from '../models/article.model'
import CategoryModel from "../models/category.model"
import CommentModel from '../models/comment.model'
import ArticleService from '../services/article'
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
			let data = await ArticleService.get(queryObj);
			res.json(data);
		}catch(err){
			console.log('获取文章列表出错:' + err);
			return next(err);
		}
	}
	//根据id获取文章
	async getArticleById(req, res, next) {
		let id = req.params['article_id'];
		try{
			let article = await ArticleService.getById(id);
			res.json({
				code: 1,
				article,
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
								.populate('category','-__v').populate('tags','-__v');
							
			res.json({
				code:1,
				type:'SUCCESS',
				articles
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
							.populate('category','-__v').populate('tags','-__v');
			res.json({
				code:1,
				type:'SUCCESS',
				articles
			});
		}catch(err){
			console.log('获取文章出错'+err);
			return next(err);
		}
	}
	
	async create(req, res, next) {
		let article = req.body.article;
		article['author'] = req.session["manager"].username || '未知用户';
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
		const id = req.params['article_id'];
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
		const id = req.params['article_id'];
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


	async deleteOne(req, res, next) {
		const id = req.params['article_id'];
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

	deleteMulti(req, res, next) {
		ArticleModel.find({ _id: { "$in": req.body.ids } })
			.then(function(articles) {
				return Promise.all(articles.map(function(article) {
					return CategoryModel.update({
						_id: article.category
					}, {
						$pull: {
							"articles": article._id
						}
					}).then(function() {
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
					});
				}));
			}).then(function() {
				res.json({
					code: 1,
					message: '删除成功'
				});
			}).catch(function(err) {
				console.log('文章批量删除失败:' + err);
				return next(err);
			})
	}

	async addLikes(req, res, next) {
		let id = req.params['article_id'];
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
				comments: comments
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