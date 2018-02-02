/*
 * 分类控制器
 */
"use strict";
//数据模型
import {CategoryModel,ArticleModel} from '../models/'
const tool = require('../utility/tool');

class CategoryObj{
	constructor(){
		
	}
	async get(req,res,next){
		let {type='',name} = req.query;
		try{
			if(type==='group'){		//根据已有文章进行分组统计
				let group = await ArticleModel.aggregate([
							{ $match:{"status":2}},
							{ $group:{ _id: "$category",count:{ $sum: 1 } }}]);

				let Pro = group.map(function(item){
					return new Promise(function(resolve, reject){
						CategoryModel.findById(item._id).then(function(rs){
							if(rs){
								item.name = rs.name;
							}else{
								item.name = '未分类';
							}
							resolve(item);
						},function(err){
							reject(err)
						})
					})
				})			
				let data = await Promise.all(Pro);
				let total = data.length
				res.json({
					code: 1,
					data,
					total
				});	
			}else if(name&&name.length){	//根据名称搜索
				let data = await TagModel.findOne({name:name},{'__v':0});
				if(!data){
					message = '该标签不存在'
				}
				res.json({
					code:1,
					data,
					message
				})
			}else{
				const total = await	CategoryModel.count();
				if(!total){
					res.json({ 	
						code: -1,
						message: 'no more'
					});
					return ;
				}
				const categories = await CategoryModel.find({});
				res.json({
					code: 1,
					data:categories,
					total
				});	
			}
		}catch(err){
			console.log('获取分类列表出错:' + err);
			return 	next(err);
		}
	}
	
	async findOneById(req,res,next){
		const id = req.params['id'];
		
		try{
			let category = await CategoryModel.findById(id,{'__v':0});
			res.json({
				code:1,
				data:category,
				message:'获取分类成功'
			})
		}catch(err){
			console.log('获取分类出错:' + err);
			return 	next(err);
		}
		
	}
	
	async create(req,res,next){
		let name = req.body.name;
	    let nameArr = name.split('/');
	    let errorMsg = '';
    	if(!name || !name.length){
			errorMsg = '请检查输入';
		}else if(tool.isRepeat(nameArr)){
    	 	errorMsg = '请检查输入不要有相同值';
    	}
    	nameArr.forEach(item =>{
    		if(!item.replace(/(^\s*)|(\s*$)/g,"").length){		//空的字符
    			errorMsg = '请检查输入格式是否正确,不要输入空的字符';
    		}
    	});
    	
    	if(errorMsg.length){
    		return res.json({
	    		code:0,
	    		type:"ERROR_PARAMS",
	    		message:errorMsg
	    	});
    	}

	   	try{
	   		let categories = await CategoryModel.find({});
			let allNames = categories.map(item =>{
				return item.name;
			});
			if(tool.hasSameValue(allNames,nameArr)){
				res.json({
					code: -1,
					type: 'ERROR_TO_ADD_CATEGORY',
					message: '请不要输入重复的分类'
				});
				return ;
			}

			let Pro = nameArr.map((name)=>{
				return new Promise(function(resolve, reject){
					try{
						CategoryModel.create({name:name}).then(function(){
							resolve('ok');
						})
					}catch(err){
						reject(err)
					}
				})
			})
			await Promise.all(Pro);
			// nameArr.map(async name =>{
			// 	await CategoryModel.create({
			// 		name:name
			// 	});
			// });
			res.json({
				code: 1,
				type: 'SUCCESS_TO_ADD_CATEGORY',
				message: '添加成功'
			});
	   	}catch(err){
	   		console.log('分类添加失败',+err);
	   		return 	next(err);
	   	}
	   	
	
	}
	
	async update(req,res,next){
		const id = req.params['id'];
		let name = req.body.name;
		if(!name.length){
			res.json({
				code: 0,
				type: 'ERROR_PARAMS',
				message:'参数错误'
			})
			return ;
		}
		try{
			let cate = await CategoryModel.findOne({name: name})
			if(cate){
				return res.json({
					code: 0,
					type: 'ERROR_TO_ADD_TAG',
					message:'已有此名字的分类'
				})
			}
			await CategoryModel.update({_id: id}, {name: name})
			res.json({
				code: 1,
				message: '更新成功'
			});
			
		}catch(err){
			return next(err);
		}
	}
	
	async remove(req,res,next){
		let ids = req.params['id'].split(',');
		try{
			await CategoryModel.remove({_id: { "$in": ids }});
			res.json({
				code: 1,
				message: '删除成功'
			});
			
		}catch(err){
			console.log('分类删除失败'+err);
			return 	next(err);
		}
	}
	
	
}


export default new CategoryObj()

