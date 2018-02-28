/*
 * 标签控制器
 */
"use strict";
//数据模型
import {TagModel,ArticleModel} from '../../models/'
import validator from 'validator'
const tool = require('../../utility/tool');

export default class TagObj{
	constructor(){
		
	}
	
	async get(req,res,next){
		let {type='',name} = req.query;
		let message;
		try{
			if(type==='group'){		//根据已有文章进行分组统计
				let group = await ArticleModel.aggregate([
							{ $match:{"status":2,"is_private":false}},
							{ $unwind : "$tags"},
							{ $group:{ _id: "$tags",count:{ $sum: 1 } }}]);
							
				let Pro = group.map(function(item){
					return new Promise(function(resolve, reject){
						TagModel.findById(item._id).then(function(rs){
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
				let total = data.length;
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
				const total = await	TagModel.count();
				if(!total){
					res.json({ 	
						code: -1,
						message: 'no more'
					});
					return ;
				}
				const tags = await TagModel.find({},{'__v':0});
				res.json({
					code: 1,
					data:tags,
					total,
				});	
			}
		}catch(err){
			console.log('获取标签列表出错:' + err);
			return next(err);
		}
		
	}
	
	async findOneById(req,res,next){
		const id = req.params['id'];
		
		try{
			let tag = await TagModel.findById(id,{'__v':0});
			res.json({
				code:1,
				data:tag,
				message:'获取标签成功'
			})
		}catch(err){
			console.log('获取标签出错:' + err);
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
	   		let tags = await TagModel.find({});
			let allNames = tags.map(item =>{
				return item.name;
			});
			if(tool.hasSameValue(allNames,nameArr)){
				res.json({
					code: -1,
					type: 'ERROR_TO_ADD_TAG',
					message: '请不要输入重复的标签'
				});
				return ;
			}

			let Pro = nameArr.map((name)=>{
				return new Promise(function(resolve, reject){
					try{
						TagModel.create({name:name}).then(function(){
							resolve('ok');
						})
					}catch(err){
						reject(err)
					}
				})
			})
			
			await Promise.all(Pro);

			// nameArr.map(async name =>{
			// 	await TagModel.create({
			// 		name:name
			// 	});
			// })
			res.json({
				code: 1,
				type: 'SUCCESS_TO_ADD_TAG',
				message: '添加成功'
			});
	   	}catch(err){
	   		console.log('添加标签出错:' + err);
			return next(err);
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
			let tag=await TagModel.findOne({name: name})
			if(tag){
				return res.json({
					code: 0,
					type: 'ERROR_TO_ADD_TAG',
					message:'已有此名字的标签'
				})
			}
			await TagModel.update({_id: id}, {name: name})
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
			await TagModel.remove({_id: { "$in": ids }});
			res.json({
				code: 1,
				message: '删除成功'
			});
		}catch(err){
			console.log('删除标签出错:' + err);
			return next(err);
		}
	}
	
}


