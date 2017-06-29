"use strict";
//后台管理路由
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const async = require('async');
const multer = require ('multer');  //上传文件中间件 multer
const md5 = require('md5');
const _=require('underscore');
const mongoose=require('mongoose');
const tool=require('../utility/tool');

//数据模型
const Article = mongoose.model('Article');			//文章
const Category=mongoose.model("Category");
const Tag=mongoose.model('Tag');
const Banner=mongoose.model("Banner");		
const Friend=mongoose.model("Friend");
const User = mongoose.model('User');
const Word = mongoose.model('Word');
const File=mongoose.model('File');



router.get('/',function(req,res,next){
	res.render('admin', {
		title: '',
	});
})


//后台angular 请求数据路由
router.get('/loadData',function(req,res,next){
	async.parallel({
		words:function(callback){
			Word.find({"state.isRead":false}).populate('user','username').exec(function(err,words){
				if(err){
					callback(err);
				}
				callback(null,words);
			})
		},
		articleTotal:function(callback){
			Article.count({}).exec(function(err,total){
				if(err){
					callback(err);
				}
				callback(null,total);
			})
		},
		categorys:function(callback){
			Category.find({}).exec(function(err,categorys){
				if(err){
					callback(err);
				}
				callback(null,categorys);
			})
		},
		tags:function(callback){
			Tag.find({}).exec(function(err,tags){
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

module.exports = router;











