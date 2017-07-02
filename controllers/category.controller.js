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
				res.json({ 	//没有更多文章
					code: -1,
					message: 'no more'
				});
				return ;
			}
			const categorys = await CategoryModel.find({})
					.skip(skip)
				     .limit(limit);
			res.json({
				code: 1,
				categorys,
				total
			});	
		}catch(err){
			console.log('获取分类列表出错:' + err);
			next(err);
		}
	}
	
	async add(req,res,next){
		let {name}=req.body.category;
		if(!name|| !name.length){
			res.send({
				code: 0,
				type: 'ERROR_PARAMS',
				message:'请输入分类名称'
			})
			return ;
		}
		
		try{
			let cate=await CategoryModel.findOne({name: name})
			if(cate) {
				throw new Error('已有此分类,不可重复')
			}
		}catch(err){
			console.log('已有此标签,不可重复');
			res.send({
				code: -1,
				type: 'ERROR_TO_ADD_CATEGORY',
				message: err.message
			})
			return;
		}
		
		
		try{
			const newCategory = new CategoryModel({
				name:name
			});
			const category=await newCategory.save();
			res.send({
				code: 1,
				category:category,
				type: 'SUCCESS_TO_ADD_CATEGORY',
				message: '添加成功'
			})
		}catch(err){
			next(err);
		}
		
		
	}
	
	async update(req,res,next){
		let {_id,name}=req.body.category;
		
		if(!name|| !name.length||!_id){
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
			res.send({
				code: -1,
				type: 'ERROR_TO_ADD_TAG',
				message: err.message
			})
			return;
		}
		
		try{
			await CategoryModel.update({_id: _id}, {name: name})
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
		let id = req.params['id'];
		if(!id){
			res.send({
				code: 0,
				type: 'ERROR_PARAMS',
				message:'参数错误'
			});
			return; 
		}
		
		try{
			CategoryModel.remove({_id: id});
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

