"use strict";
//后台管理路由
import express from 'express'
import async from 'async'

//数据模型
import ArticleModel from '../models/article.model'
import CategoryModel from "../models/category.model"
import TagModel from '../models/tag.model'	
import WordModel from '../models/word.model'	

const router = express.Router();
const tool=require('../utility/tool');




router.get('/',function(req,res,next){
	res.render('admin', {
		title: '',
	});
})


//后台angular 请求数据路由
router.get('/loadData',function(req,res,next){
	async.parallel({
		words:function(callback){
			WordModel.find({"state.isRead":false}).populate('user','username').exec(function(err,words){
				if(err){
					callback(err);
				}
				callback(null,words);
			})
		},
		articleTotal:function(callback){
			ArticleModel.count({}).exec(function(err,total){
				if(err){
					callback(err);
				}
				callback(null,total);
			})
		},
		categorys:function(callback){
			CategoryModel.find({}).exec(function(err,categorys){
				if(err){
					callback(err);
				}
				callback(null,categorys);
			})
		},
		tags:function(callback){
			TagModel.find({}).exec(function(err,tags){
				if(err){
					callback(err);
				}
				callback(null,tags);
			})
		}
	},function(err,results){
		if(err){
			next(err);
		}
		res.json({
			articleTotal:results.articleTotal,			//文章总数
			words:results.words,			//留言
			categorys:results.categorys,	//文章分类
			tags:results.tags				//文章标签
		});
	
	});
});

export default router;











