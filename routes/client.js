"use strict";
import express from 'express'
import async from 'async'

//数据模型
import ArticleModel from '../models/article.model'
import CategoryModel from "../models/category.model"
import BannerModel from '../models/banner.model'
import CommentModel from '../models/comment.model'

import tool from '../utility/tool'
import Auth from '../middleware/auth'
import loadCommonData from '../middleware/common' 

import ArticleService from '../services/article'

const router = express.Router();

//router.get("*",loadCommonData);

router.get('/', loadCommonData, async (req, res, next)=>{
	let limit = parseInt(CONFIG.PageSize);
	try{
		let data = await ArticleService.get({limit:limit});
		let banners = await BannerModel.find({}).sort({ weight: -1 }).limit(3);
		res.render('www/index', {
			title: CONFIG.SiteName,
			banners,
			total: data.total,
			articles: data.articles, //所有文章
			currentpage: data.cp, 	//当前页码
			pagesize: limit 		//列表数
		});
	}catch(err){
		next(err);
	}
	
})

router.get('/page/:page', loadCommonData, async (req, res, next)=> {
	let page = parseInt(req.params["page"]);
	let limit = parseInt(CONFIG.PageSize);
	try{
		let data = await ArticleService.get({cp:page,limit:limit});
		res.render('www/blocks/article_list', {
			articles: data.articles
		})
	}catch(err){
		next(err);
	}

})



//文章详情页面
router.get('/article/:bId', loadCommonData, function(req, res, next) {
	const bid = req.params["bId"];
	async.auto({ //智能控制
		doc: function(callback) {
			ArticleModel.findByBId(bid, function(article) {
				if(!article) { //没找到就发送一个404
					//					let err = new Error('Not Found');
					//					err.status = 404;
					//					return next(err);
					return res.status(404).render('www/404');
				}

				let opts = [{
					path: 'category',
					select: 'name'
				}];
				article.populate(opts, function(err, doc) {
					ArticleModel.findBybIdUpdate(bid, function() {
						callback(null, doc);
					});
				});
			});
		},
		hot: function(callback) {
			ArticleModel.findByHot(2, function(hot) {
				callback(null, hot);
			});
		},
		nextArticle: function(callback) {
			ArticleModel.findNext(bid, function(nextArticle) { //下一篇
				callback(null, nextArticle);
			});
		},
		prevArticle: function(callback) {
			ArticleModel.findPrev(bid, function(prevArticle) { //上一篇
				let prevArticleName = prevArticle;
				callback(null, prevArticle);
			});
		},
		comments: ["doc", function(results, callback) {
			let articleId = results.doc._id;
			CommentModel.find({ articleId: articleId })
				.populate('from','username')
				.populate('reply.from reply.to','username').sort({ 'nums.likeNum': -1 }).exec(function(err, comments) {
					let cTotal = comments.length;
					comments.forEach(function(value) {
						if(value.reply && value.reply.length > 0) {
							cTotal += value.reply.length;
						}
					})
					results.cTotal = cTotal;
					callback(null, comments);
				});
		}],
	}, function(err, results) {

		let rsObj = {
			article: results.doc,
			hot: results.hot,
			title: results.doc.title,
			nextArticle: results.nextArticle,
			prevArticle: results.prevArticle,
			comments: results.comments, //评论
			cTotal: results.cTotal //评论数量
		}
		res.render("www/article", rsObj);
	});
})

//列出类型下的文章
router.get('/category/:name', function(req, res, next) {
	let category_name = req.params.name;
	async.waterfall([
		function(cb) {
			CategoryModel.findOne({ name: category_name }).exec(function(err, category) {
				if(category) {
					return cb(null, category);
				}
				cb({ code: -1 })
			})
		},
		function(category, cb) {
			ArticleModel.find({ category: category._id }).populate('category', 'name').then(function(articles) {
				if(articles) {
					return cb(null, category, articles);
				}
			});
		}
	], function(err, category, articles) {
		if(err && err.code == -1) {
			articles = [];
		}
		res.render('www/category', {
			articles: articles,
			title: category_name + '——徐浩的个人博客'
		});
	})
})

//搜索文章
router.get('/search', loadCommonData, function(req, res, next) {
	let title = req.query.wd;
	async.waterfall([
		function(callback) {
			ArticleModel.find({ title: { $regex: '' + title + '' } })
				.sort({ create_time: -1 })
				.exec(function(err, articles) {
					callback(null, articles)
				});
		},
	], function(err, articles) {
		if(err) {
			console.log('文章查询出错:' + err);
			return next(err);
		}
		res.render("www/search_results", {
			articles: articles,
			title: '搜索结果'
		});
	});
})

//留言页面
router.get('/word', function(req, res, next) {
	res.render("www/word", {
		title: '留言'
	});
})

//关于页面
router.get('/about', function(req, res, next) {
	res.render("www/about", {
		title: '关于我'
	})
})

export default router;