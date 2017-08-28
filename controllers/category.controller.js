/*
 * 分类控制器
 */
"use strict";
import path from 'path'
import fs from 'fs'
import _ from 'underscore'
import mongoose from 'mongoose'

//数据模型
import CategoryModel from "../models/category.model"
const tool = require('../utility/tool');

class CategoryObj{
	constructor(){
		
	}
	async getCategories(req,res,next){
		let {skip=0,limit=0} = req.query;
		skip = parseInt(skip);
		limit = parseInt(limit);
		try{
			const total = await	CategoryModel.count();
			if(!total){
				res.json({ 	
					code: -1,
					message: 'no more'
				});
				return ;
			}
			const categories = await CategoryModel.find({})
					.skip(skip)
				     .limit(limit);
			res.json({
				code: 1,
				categories,
				total
			});	
		}catch(err){
			console.log('获取分类列表出错:' + err);
			next(err);
		}
	}
	
	async add(req,res,next){
		const categoryName = req.body.name;
	    const nameArr = categoryName.split('/');
	    try{
	    	if(!categoryName || !categoryName.length){
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
	   		let categories = await CategoryModel.find({});
			categories.map(item =>{
				rsNames.push(item.name)
			});
			if(tool.hasSameValue(rsNames,nameArr)){
				res.json({
					code: -1,
					type: 'ERROR_TO_ADD_CATEGORY',
					message: '请不要输入重复的分类'
				});
				return ;
			}
			nameArr.map(async name =>{
				await CategoryModel.create({
					name:name
				});
			});
			res.json({
				code: 1,
				type: 'SUCCESS_TO_ADD_CATEGORY',
				message: '添加成功'
			});
	   	}catch(err){
	   		next(err);
	   	}
	   	
	
	}
	
	async update(req,res,next){
		const id = req.params['category_id'];
		let {name}=req.body;
		
		if(!name.length){
			res.json({
				code: 0,
				type: 'ERROR_PARAMS',
				message:'参数错误'
			})
			return ;
		}
		
		try{
			let cate=await CategoryModel.findOne({name: name})
			if(cate){
				throw new Error('已有此标签,不可重复')
			}
		}catch(err){
			console.log('已有此标签,不可重复');
			res.json({
				code: -1,
				type: 'ERROR_TO_ADD_TAG',
				message: err.message
			})
			return;
		}
		
		try{
			await CategoryModel.update({_id: id}, {name: name})
			res.json({
				code: 1,
				message: '更新成功'
			});
		}catch(err){
			next(err)
		}
	}
	
	async remove(req,res,next){
		let id = req.params['category_id'];
		if(!id){
			res.json({
				code: 0,
				type: 'ERROR_PARAMS',
				message:'参数错误'
			});
			return; 
		}
		
		try{
			await CategoryModel.remove({_id: id});
			res.json({
				code: 1,
				message: '删除成功'
			});
			
		}catch(err){
			next(err);
		}
	}
	
	
}


export default new CategoryObj()

