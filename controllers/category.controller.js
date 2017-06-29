/*
 * 分类控制器
 */
"use strict";
import path from 'path'
import fs from 'fs'
import _ from 'underscore'
import mongoose from 'mongoose'

//数据模型
const CategoryModel = mongoose.model("Category");


class CategoryObj{
	constructor(){
		
	}
	async getCategories(req,res,next){
		try{
			let categories=await CategoryModel.find({})
			res.json({
				code: 1,
				categorys: categories
			});
		}catch(err){
			next(err)
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








//获取分类
//exports.getCategories=function(req,res,next){
//	Category.find({}).exec(function(err, categorys) {
//		if(err){
//			return next(err);
//		}
//		res.json({
//			code: 1,
//			categorys: categorys
//		});
//	});
//}
//
////添加分类
//exports.add=function(req,res,next){
//	let category = req.body.category,
//		name = category.name;
//	let _category = new Category(category);
//
//	Category.findOne({
//		name: name
//	}).then(function(cate) {
//		if(cate) {
//			throw {
//				code: -1,
//				message: '已有此类型,不可重复'
//			}
//		}
//		return _category.save();
//	}).then(function(category) {
//		res.json({
//			code: 1,
//			category: category,
//			message: '添加成功'
//		});
//	}).catch(function(err) {
//		console.log('类型添加失败:' + err);
//		if(err.code) {
//			return res.json({
//				code: err.code,
//				message: err.message
//			})
//		}
//		next(err);
//	});
//}
//
//
////更新分类
//exports.update=function(req,res,next){
//	let category = req.body.category,
//		id = category._id,
//		name = category.name;
//	Category.findOne({
//		name: name
//	}).then(function(cate) {
//		if(cate) {
//			throw {
//				code: -1,
//				message: '已有此类型,不可重复'
//			}
//		}
//		return Category.update({
//			_id: id
//		}, {
//			name: name
//		}).exec();
//	}).then(function() {
//		res.json({
//			code: 1,
//			message: '更新成功'
//		});
//	}).catch(function(err) {
//		console.log('类型更新失败:' + err);
//		if(err.code) {
//			return res.json({
//				code: err.code,
//				message: err.message
//			});
//		}
//		next(err);
//	});
//}
//
////删除分类
//exports.remove=function(req,res,next){
//	let id = req.params['id'];
//	Category.remove({
//		_id: id
//	}).exec(function(err) {
//		res.json({
//			code: 1,
//			message: '删除成功'
//		});
//	});
//}
//
