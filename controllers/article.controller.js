/*
 * 文章控制器（文章发布，查询，删除）
 */
"use strict";
import path from 'path'
import fs from 'fs'
import _ from 'underscore'
import mongoose from 'mongoose'
import UploadComponent from '../prototype/upload'
//数据模型
import ArticleModel from '../models/article.model'
import CategoryModel from "../models/category.model"
import CommentModel from '../models/comment.model'

const tool = require('../utility/tool');

class ArticleObj extends UploadComponent {
	constructor() {
		super()
		this.publish = this.publish.bind(this)
		this.update = this.update.bind(this)
	}
	async getArticles(req, res, next) {
		let { currentPage = 1, limit = 5, title = "", flag = 0 } = req.query;

		currentPage = parseInt(currentPage) - 1;
		limit = parseInt(limit);
		flag = parseInt(flag);
		let queryObj = {
			title: {
				'$regex': title
			},
		}
		switch(flag) {
			case 1: //有效
				queryObj.isDeleted = false;
				queryObj.isDraft = false;
				break;
			case 2: //草稿
				queryObj.isDraft = true;
				queryObj.isDeleted = false;
				break;
			case 3: //已删除
				queryObj.isDeleted = true;
				break;
		}

		try {
			const total = await ArticleModel.count(queryObj);
			if(!total) {
				res.json({ //没有更多文章
					code: -1,
					message: '没有更多文章'
				});
				return;
			}
			const articles = await ArticleModel.find(queryObj)
				.sort({ "create_time": -1 }).skip(limit * currentPage)
				.limit(limit).populate('category', 'name');
			res.json({
				code: 1,
				articles,
				total
			});
		} catch(err) {
			console.log('获取文章列表出错:' + err);
			next(err);
		}
	}

	async getArticleById(req, res, next) {
		let id = req.params['id'];
		if(!id) {
			res.json({
				code: 0,
				type: 'ERROR_PARAMS',
				message: '请输入文章ID'
			});
			return;
		}

		try {
			let article = await ArticleModel.findById(id).populate('category').populate('tags');
			res.json({
				code: 1,
				article,
				message: 'success'
			});
		} catch(err) {
			res.status(500).json({
				message: '查询出错'
			});
		}
	}

	async publish(req, res, next) {
		let article = req.body.article;
		article['author'] = req.session["manager"].username || '未知用户';
		try {
			if(req.file) {
				let imgurl = await this.upload(req);
				article.img = imgurl;
			}
			let newarticle = new ArticleModel(article);
			article = await newarticle.save();
			const categoryId = article.category;
			await CategoryModel.update({ _id: categoryId }, { '$addToSet': { "articles": article._id } });
			res.json({
				code: 1,
				article,
				message: '发布成功'
			});
		} catch(err) {
			console.log('文章发布出错' + err);
			next(err);
		}
	}

	async update(req, res, next) {
		let newArticle = req.body.article;
		try {
			if(req.file) {
				let imgurl = await this.upload(req);
				newArticle.img = imgurl;
			}
			let article = await ArticleModel.findById(newArticle._id);
			let _article = _.extend(article, newArticle);
			await _article.save();
			res.json({
				code: 1,
				message: '更新成功'
			});
		} catch(err) {
			console.log('更新文章失败:' + err);
			next(err);
		}
	}

	async deleteOne(req, res, next) {
		let id = req.params['id'];
		if(!id) {
			res.json({
				code: 0,
				type: 'ERROR_PARAMS',
				message: '请输入文章ID'
			});
			return;
		}

		try {
			let article = await ArticleModel.findById(id);
			await CategoryModel.update({ _id: article.category }, { $pull: { "articles": article._id } });
			if(article.isDeleted) {
				await ArticleModel.remove({ _id: article._id });
			} else {
				await ArticleModel.update({ _id: article._id }, { 'isDeleted': true });
			}
			res.json({
				code: 1,
				message: '删除成功'
			});
		} catch(err) {
			console.log('删除文章出错' + err);
			next(err);
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
						if(article.isDeleted) { //彻底删除
							return ArticleModel.remove({
								_id: article._id
							}).then(function() { //返回promise对象
								return 1; //返回下一个promise resolve 对象的值
							});
						} else { //（假删除）
							return ArticleModel.update({
								_id: article._id
							}, {
								'isDeleted': true
							}).then(function() { //返回promise对象
								return 1; //返回下一个promise resolve 对象的值
							});
						}
					});
				}));
			}).then(function(dd) {
				//console.log(dd);		//1
				res.json({
					code: 1,
					message: '删除成功'
				});
			}).catch(function(err) {
				console.log('文章批量删除失败:' + err);
				next(err);
			})
	}

	async addLikes(req, res, next) {
		console.log(req.params['id']);
		res.json({
			code: 1
		})
	}

	async getComments(req, res, next) {
		let articleId = req.params['id'];
		let { order_by, page = 1 } = req.query;
		let sort = { likeNum: -1 }

		if(order_by == "timeSeq") {
			sort = { create_time: 1 }
		} else if(order_by == "timeRev") {
			sort = { create_time: -1 }
		}
		try {
			const comments = await CommentModel.find({ articleId: articleId })
				.populate('from')
				.populate('reply.from reply.to')
				.sort(sort);
			if(comments) {
				res.render("www/blocks/comment_list", {
					comments: comments
				});
			}
		} catch(err) {
			console.log(err);
			next(err);
		}
	}

	async addComment(req, res, next) {
		let _comment = req.body;
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
				res.json({
					code: 1
				});
			} catch(err) {
				next(err);
				console.log(err);
			}
		} else {
			_comment.create_time = new Date();
			let newcomment = new CommentModel(_comment);
			try {
				await newcomment.save();
				res.json({
					code: 1
				});
			} catch(err) {
				next(err);
				console.log('评论报错出错:' + err);
			}
		}
	}

	async addCommentLike(req, res, next) {
		const commentId = req.params['id'],
			replyId = req.body.replyId,
			user = req.session['User'];

		if(!commentId) {
			return res.status(500).json({
				message: '请求参数有误'
			})
		}

		try {
			let comment = await CommentModel.findById(commentId);
			if(!comment) {
				res.json({
					code: 0,
					message: '错误'
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
				reply.forEach(function(value) {
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
			next(err);
		}
	}
}

export default new ArticleObj();