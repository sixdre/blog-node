/*
 * 文章控制器（文章发布，查询，删除）
 */
"use strict";
const path = require('path');
const fs = require('fs');
const async = require('async');
const _ = require('underscore');
const mongoose = require('mongoose');
const tool = require('../utility/tool');

//数据模型
const Article = mongoose.model('Article'); 
const Category = mongoose.model("Category");
const Tag = mongoose.model('Tag');
const Comment=mongoose.model('Comment');		
const User = mongoose.model('User');


//class ArticleObj{
//	constructor(props) {
//
//	}
//	async getArticles(req,res,next){
//		let cc=await Article.count({});
//		let bb=await Article.find({});
//		console.log(cc+'----------------------------------------');
//		console.log(bb.length+'----------------------------------------');
//	}
//	
//	
//	
//}
//export default new ArticleObj()



//文章获取
exports.getArticles= function(req,res,next){
	let currentPage = parseInt(req.query.currentPage) - 1;
	let limit = parseInt(req.query.limit);
	let title = req.query.title || '';
	let flag = parseInt(req.query.flag) || 0;
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
	Article.count(queryObj).exec().then(function(total) {
		return total;
	}).then(function(total) {
		if(total) {
			let query = Article.find(queryObj)
				.sort({
					"create_time": -1
				}).skip(limit * currentPage).limit(limit);
			query.populate('category', 'name').exec().then(function(articles) {
				console.log(articles);
				res.json({
					code: 1,
					articles: articles,
					total: total
				});
			})
		} else {
			res.json({ //没有更多文章
				code: -1,
				message: '没有更多文章'
			});
		}
	}).catch(function(err) {
		console.log('文章分页查询出错:' + err);
		next(err);
	})
}

//根据id来获取文章
exports.getArticleById=function(req,res,next){
	let id = req.params['id'];
	Article.findById(id).populate('category').populate('tags').then(function(article) {
		res.json({
			code: 1,
			article: article,
			message: 'success'
		})
	}).catch(function(err) {
		res.status(500).json({
			message: '查询出错'
		});
	})
}

//文章发布
exports.publish=function(req,res,next){
	let article = req.body.article;
	article['author'] = req.session["manager"].username || '徐小浩';
	if(req.file) {
		let nameArray = req.file.originalname.split('.')
		let type = nameArray[nameArray.length - 1];
		if(!tool.checkUploadImg(type)) {
			return res.json({
				code: -2,
				message: '文章封面格式错误'
			})
		}
		if(req.file.path) {
			article.img = req.file.path.substring(6);
		}
	}

	let _article = new Article(article);
	_article.save().then(function(article) {
		return article;
	}).then(function(article) {
		let categoryId = article.category;
		return Category.update({
			_id: categoryId
		}, {
			'$addToSet': {
				"articles": article._id
			}
		});
	}).then(function() {
		res.json({
			code: 1,
			article: article,
			message: '发布成功'
		});
	}).catch(function(err) {
		console.log('文章发布出错' + err);
		next(err);
	});
}


//文章更新
exports.update=function(req,res,next){
	let newArticle = req.body.article;
	if(req.file) {
		let nameArray = req.file.originalname.split('.')
		let type = nameArray[nameArray.length - 1];
		if(!tool.checkUploadImg(type)) {
			return res.json({
				code: -2,
				message: '文章封面格式错误'
			})
		}
		if(req.file.path) {
			newArticle.img = req.file.path.substring(6);
		}
	}
	Article.findById(newArticle._id).then(function(article) {
		let _article = _.extend(article, newArticle);
		return _article.save();
	}).then(function(rs) {
		res.json({
			code: 1,
			article: rs,
			message: '更新成功'
		});
	}).catch(function(err) {
		console.log('更新文章失败:' + err);
		next(err);
	});
}

//单项删除
exports.deleteOne=function(req,res,next){
	let id =req.params['id'];
	Article.findById(id).then(function(article) {
		return Category.update({
			_id: article.category
		}, {
			$pull: {
				"articles": article._id
			}
		}).then(function() {
			return article;
		});
	}).then(function(article) {
		if(article.isDeleted) { //如果文章已经是删除掉，进入垃圾箱了就将其彻底删除
			return Article.remove({
				_id: article._id
			});
		} else { //（假删除）可在垃圾箱中找回
			return Article.update({
				_id: article._id
			}, {
				'isDeleted': true
			});
		}
	}).then(function() {
		res.json({
			code: 1,
			message: '删除成功'
		});
	}).catch(function(err) {
		console.log('删除文章出错' + err);
		next(err);
	});
}


//多项删除
exports.deleteMulti=function(req,res,next){
	Article.find({
		_id: {
			"$in": req.body.ids
		}
	}).then(function(articles) {
		return Promise.all(articles.map(function(article) {
			return Category.update({
				_id: article.category
			}, {
				$pull: {
					"articles": article._id
				}
			}).then(function() {
				if(article.isDeleted) { //彻底删除
					return Article.remove({
						_id: article._id
					}).then(function() { //返回promise对象
						return 1; 		//返回下一个promise resolve 对象的值
					});
				} else { //（假删除）
					return Article.update({
						_id: article._id
					}, {
						'isDeleted': true
					}).then(function() { //返回promise对象
						return 1; 		//返回下一个promise resolve 对象的值
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

//查询文章(目前只做了根据标题查询);
exports.search=function(req,res,next){
	let title = req.query.title;
	Article.find({
		title: {
			$regex: '' + title + ''
		}
	}).then(function(articles) {
		if(articles.length) {
			res.json({
				code: 1,
				results: articles,
				message: '找到相关文章'
			});
		} else {
			res.json({
				code: -1,
				message: '没有找到相关文章'
			});
		}
	}).catch(function(err) {
		console.log('文章查询失败:' + err);
		next(err);
	});
}


//文章点赞
exports.addLikes=function(req,res,next){
	console.log(req.params['id'])
	res.json({
		code:1
	})
}

//获取文章评论
exports.getComments=function(req,res,next){
	let articleId=req.params['id'],
		order_by=req.query.order_by,
		page=req.query.page;
	let sort={
		likeNum:-1
	}
	if(order_by=="timeSeq"){
		sort={
			create_time:1
		}
	}else if(order_by=="timeRev"){
		sort={
			create_time:-1
		}
	}
	Comment.find({ articleId: articleId })
		.populate('from')
		.populate('reply.from reply.to')
		.sort(sort).exec()
	.then(function(comments){
		console.log(comments);
		if(comments){
			res.render("www/blocks/comment_list",{
				comments:comments
			});
		}
	}).catch(function(err){
		if(err){
			console.log(err);
			res.status(500);
		}
	})
}

//添加评论
exports.addComment=function(req,res,next){
	let _comment=req.body;
	_comment.from=req.session["User"];
	if(_comment.cId){
		let reply={
			from:_comment.from._id,
			to:_comment.toId,
			content:_comment.content,
			create_time:new Date()
		};
		Comment.update({_id:_comment.cId},{
			$addToSet:{"reply": reply}
		}).then(function(){
			res.json({
				code:1
			});
		}).catch(function(err){
			next(err);
			console.log(err);
		});
	}else{
		_comment.create_time=new Date();
		let comment=new Comment(_comment);
		comment.save().then(function(comment){
			res.json({
				code:1
			});
		}).catch(function(err){
			next(err);
			console.log('评论报错出错:'+err);
		});
	}
}

//评论点赞
exports.addCommentLike=function(req,res,next){
	let commentId=req.params['id'],
		replyId=req.body.replyId,
		user=req.session['User'];
	if(!commentId){
		return res.status(500).json({
			message:'请求参数有误'
		})
	}
	Comment.findOne({_id:commentId}).exec(function(err,comment){
		if(err){
			console.log('评论点赞出错:'+err);
			return next(err);
		}
		if(comment&&!replyId){	//评论点赞
			if(comment.likes.indexOf(user._id)>-1){
				res.json({
					code:-2,
					message:'您已点赞'
				})
			}else{
				comment.likes.push(user._id);
				comment.save(function(err,ct){
					if(err){
						console.log('评论点赞保存出错:'+err);
						return next(err);
					}
					res.json({
						code:1,
						message:'点赞更新成功'
					});
				});
			}
		}else if(comment&&replyId){		//给回复点赞
			let reply=comment.reply;
			reply.forEach(function(value){
				if(value._id==replyId){
					if(value.likes.indexOf(user._id)>-1){
						return res.json({
							code:-2,
							message:'您已点赞'
						})
					}
					value.likes.push(user._id);
					comment.save(function(err){
						if(err){
							console.log('评论点赞保存出错:'+err);
							return next(err);
						}
						res.json({
							code:1,
							message:'点赞更新成功'
						})
					})
				}
			})
		}
	})
}
