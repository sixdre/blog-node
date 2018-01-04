/*
 * 标签控制器
 */
"use strict";
//数据模型
import {TagModel} from '../models/'
const tool = require('../utility/tool');

class TagObj{
	constructor(){
		
	}
	
	async getTags(req,res,next){
		let {skip=0,limit=0} = req.query;
		skip = parseInt(skip);
		limit = parseInt(limit);
		
		try{
			const total = await	TagModel.count();
			if(!total){
				res.json({ 	
					code: -1,
					message: 'no more'
				});
				return ;
			}
			const tags = await TagModel.find({})
					.skip(skip)
				     .limit(limit);
			res.json({
				code: 1,
				data:tags,
				total
			});	
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
	    let nameArr = tagName.split('/');
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
			nameArr.map(async name =>{
				await TagModel.create({
					name:name
				});
			})
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

export default new TagObj()

