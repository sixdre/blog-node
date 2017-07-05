/*
 * 标签控制器
 */
"use strict";
import path from 'path'
import fs from 'fs'
import _ from 'underscore'
import mongoose from 'mongoose'

//数据模型
import TagModel from '../models/tag.model'	
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
				tags,
				total
			});	
		}catch(err){
			console.log('获取标签列表出错:' + err);
			next(err);
		}
		
	}
	
	async add(req,res,next){
		const tagName = req.body.name;
	    const nameArr = tagName.split('/');
	    try{
	    	if(!tagName|| !tagName.length){
				throw new Error('请检查输入');
			}else if(tool.isRepeat(nameArr)){
	    	 	throw new Error('请检查输入不要有相同值');
	    	}
	    	nameArr.map(item =>{
	    		if(!item.replace(/(^\s*)|(\s*$)/g,"").length){		//空的字符
	    			throw new Error('请检查输入格式是否正确,不要输入空的字符');
	    		}
	    	});
	    }catch(err){
	    	res.json({
	    		code:0,
	    		type:"ERROR_PARAMS",
	    		message:err.message
	    	});
	    	return ;
	    }
	   	
	   	try{
	   		let rsNames=[];
	   		let tags = await TagModel.find({});
			tags.map(item =>{
				rsNames.push(item.name)
			});
			if(tool.hasSameValue(rsNames,nameArr)){
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
	   		next(err);
	   	}
		
//		let {_id,name}=req.body;
//		if(!name || !name.length){
//			res.send({
//				code: 0,
//				type: 'ERROR_PARAMS',
//				message:'请输入标签名称'
//			})
//			return ;
//		}
//		
//		try{
//			let tag=await TagModel.findOne({name: name});
//			if(tag) {
//				throw new Error('已有此标签,不可重复')
//			}
//		}catch(err){
//			console.log('已有此标签,不可重复');
//			res.send({
//				code: -1,
//				type: 'ERROR_TO_ADD_TAG',
//				message: err.message
//			})
//			return;
//		}
//		try{
//			const newTag=new TagModel({
//				name:name
//			})
//			const tag=await newTag.save();
//			res.send({
//				code: 1,
//				tag:tag,
//				type: 'SUCCESS_TO_ADD_TAG',
//				message: '添加成功'
//			})
//		}catch(err){
//			res.send({
//				code: -1,
//				type: 'ERROR_TO_ADD_TAG',
//				message: '添加失败'
//			})
//		}

	}
	async update(req,res,next){
		const id = req.params['tag_id'];
		let {name} = req.body;
		
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
				throw new Error('已有此标签,不可重复')
			}
		}catch(err){
			console.log('已有此标签,不可重复');
			res.send({
				code: -1,
				type: 'ERROR_TO_ADD_TAG',
				message: err.message
			})
			return;
		}
		
		try{
			await TagModel.update({_id: id}, {name: name})
			res.json({
				code: 1,
				message: '更新成功'
			});
		}catch(err){
			res.json({
				message: '更新失败'
			});
		}
	}
	
	async remove(req,res,next){
		let id = req.params['tag_id'];
		try{
			await TagModel.remove({_id: id})
			res.json({
				code: 1,
				message: '删除成功'
			});
		}catch(err){
			res.json({
				code: -1,
				message: '删除失败'
			});
		}
	}
	
}

export default new TagObj()

