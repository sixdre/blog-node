/*
 * 文章控制器（文章发布，查询，删除）
 */
"use strict";
import _ from 'underscore'
import request from 'request'
import {ArticleModel,CategoryModel,CommentModel,TagModel} from '../models/'
import UploadComponent from '../prototype/upload'

const tool = require('../utility/tool');

export default class ArticleObj extends UploadComponent{
	constructor() {
		super()
		this.create = this.create.bind(this)
		this.remove = this.remove.bind(this);
	}
	//获取文章
	async get(req, res, next) {
		let { page = 1, limit = 10, title = "", flag = 2 } = req.query;
		let queryParams={
			status:parseInt(flag),
			title: {
                '$regex': title
            },
		}
		try{
			let results = await ArticleModel.getListToPage(queryParams,page,limit)
			res.json({
				code:1,
				data:results.data,
				total:results.total,
				limit:results.pageSize
				
			});
		}catch(err){
			console.log('获取文章列表出错:' + err);
			return next(err);
		}
	}
	//获取登录用户的文章
	async getLoginUserArticles(req,res,next){
		const userId = req.userInfo._id;
		let { page = 1, limit = 10, title = "", flag = 2 } = req.query;
		let queryParams={
			'author':userId,
			status:parseInt(flag),
			title: {
                '$regex': title
            },
		}
		try{
			let results = await ArticleModel.getListToPage(queryParams,page,limit)
			res.json({
				code:1,
				data:results.data,
				total:results.total,
				limit:results.pageSize
				
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
			let article = await ArticleModel.getOneById(id);
			if(!article||article.status==0){
				return res.json({
					code: 0,
					message: '文章不存在或已被删除'
				});
			}
			let data = article.setTagName();
			if(pv){
				await ArticleModel.updatePv(id);
				data.nums.pv+=1;
			}
			res.json({
				code: 1,
				data:data,
				message: 'success'
			});
		}catch(err){
			console.log('获取文章出错',+err);
			return next(err);
		}
	}

	async getArticlesByTagId(req,res,next){
		let tagId = req.params['tag_id'];
		let {page=1,pageSize = 100} = req.query;
		try{
			let queryParams = {
				'tags':{'$in':[tagId]}
			}
			let results = await ArticleModel.getListToPage(queryParams,page,pageSize);
			res.json({
				code:1,
				msg:'success',
				data:results.data,
				total:results.total,
				pageSize:results.pageSize
			});
		}catch(err){
			console.log('获取文章出错'+err);
			return next(err);
		}
	}
	
	async getArticlesByCategoryId(req,res,next){
		const cId = req.params['category_id'];
		let {page=1,pageSize = 100} = req.query;
		try{
			let queryParams ={
				'category':{'$in':[cId]}
			}
			let results = await ArticleModel.getListToPage(queryParams,page,pageSize);
			res.json({
				code:1,
				msg:'success',
				data:results.data,
				total:results.total,
				pageSize:results.pageSize
			});
		}catch(err){
			console.log('获取文章出错'+err);
			return next(err);
		}
	}
	
	async create(req, res, next) {
		let article = req.body.article;
		article.author = req.userInfo._id;
		try {
			let rart = await ArticleModel.findOne({title:article.title});
			if(rart){
				return res.json({
					code: 0,
					message: '文章标题已存在'
				})
			}
			//检查tag如果已有tag就查询获取tagid否则创建新的tag
			let Pro = article.tagNames.map((item)=>{
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
			let ncate = await CategoryModel.findOne({name:article.categoryName});
			if(!ncate){
				let dcate = await CategoryModel.create({name:article.categoryName});
				article.category = dcate._id;
			}else{
				article.category = ncate._id;
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
			await new ArticleModel(article).save();			
			res.json({
				code: 1,
				message: '发布成功'
			});
		} catch(err) {
			console.log('文章发布出错' + err);
			return next(err);
		}
	}

	async update(req,res,next){
		const id = req.params['id'];
		let article = req.body.article;
		try{
			let rart = await ArticleModel.findOne({title:article.title});
			if(rart&&String(rart._id)!==id){
				return res.json({
					code: 0,
					message: '文章标题已存在'
				})
			}

			//检查tag如果已有tag就查询获取tagid否则创建新的tag
			let Pro = article.tagNames.map((item)=>{
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
			let ncate = await CategoryModel.findOne({name:article.categoryName});
			if(!ncate){
				let dcate = await CategoryModel.create({name:article.categoryName});
				article.category = dcate._id;
			}else{
				article.category = ncate._id;
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

			let barticle = await ArticleModel.findById(id);
			let _article = _.extend(barticle, article);
			await _article.save();

			res.json({
				code: 1,
				message: '更新成功'
			});

		}catch(err){

		}
	}



	removeOne(item) {
		return new Promise(async function(resolve, reject){
			try{
				if(item.status===0) { //彻底删除
					await ArticleModel.remove({
						_id: item._id
					})
				} else{ 			//（假删除）
					await ArticleModel.update({
						_id: item._id
					}, {
						'status': 0
					});
				}
				resolve('ok');
			}catch(err){
				reject(err)
			}
			
		})
	}

	async remove(req, res, next) {
		const ids = req.params['id'].split(',');
		const userInfo = req.userInfo;
		try{
			let articles = await ArticleModel.find({ _id: { "$in": ids } });
			let pro = articles.map((item)=>{
				return new Promise(async (resolve, reject)=>{
					try{
						if(!item.is_private){	//不是私有的管理员可以删除
							await this.removeOne(item);
						}else if(item.is_private&&item.author==userInfo.username){	//私有的只能作者可以删除
							await this.removeOne(item);
						}
						resolve('ok');
					}catch(err){
						reject(err)
					}
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
			let article = await ArticleModel.findOne({_id:id,is_private:false});
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

	
}

