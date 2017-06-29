/*
 * 标签控制器
 */
"use strict";
import path from 'path'
import fs from 'fs'
import _ from 'underscore'
import mongoose from 'mongoose'

//数据模型
const TagModel = mongoose.model("Tag");

class TagObj{
	constructor(){
		
	}
	
	async getTags(req,res,next){
		try{
			let tags=await TagModel.find({});
			res.json({
				code:1,
				tags:tags
			})
		}catch(err){
			console.log('获取标签失败');
			throw new Error(err);
		}
	}
	
	async add(req,res,next){
		let {_id,name}=req.body.tag;
		if(!name || !name.length){
			res.send({
				code: 0,
				type: 'ERROR_PARAMS',
				message:'请输入标签名称'
			})
			return ;
		}
		
		try{
			let tag=await TagModel.findOne({name: name});
			if(tag) {
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
			const newTag=new TagModel({
				name:name
			})
			const tag=await newTag.save();
			res.send({
				code: 1,
				tag:tag,
				type: 'SUCCESS_TO_ADD_TAG',
				message: '添加成功'
			})
		}catch(err){
			res.send({
				code: -1,
				type: 'ERROR_TO_ADD_TAG',
				message: '添加失败'
			})
		}

	}
	async update(req,res,next){
		let {_id,name} = req.body.tag;
		
		if(!name|| !name.length||!_id){
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
			await TagModel.update({_id: _id}, {name: name})
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


////获取标签
//exports.getTags= async function(req,res,next){
//	try{
//		let tags=await TagModel.find({});
//		res.json({
//			code:1,
//			tags:tags
//		})
//	}catch(err){
//		console.log('获取标签失败');
//		throw new Error(err);
//	}
//}
//
//
////old
////exports.getTags=function(req,res,next){
////	
////	TagModel.find({}).exec(function(err, tags) {
////		if(err){
////			return next(err);
////		}
////		res.json({
////			code: 1,
////			tags: tags
////		});
////	});
////}
//
//
////添加标签
//exports.add=function(req,res,next){
//	let _tag = req.body.TagModel,
//		id = _tag._id,
//		name = _tag.name;
//	let newtag = new TagModel(_tag);
//	
//	TagModel.findOne({
//		name: name
//	}).then(function(TagModel) {
//		if(TagModel) {
//			throw {
//				code: -1,
//				message: '已有此标签,不可重复'
//			}
//		}
//		return newtag.save();
//	}).then(function(TagModel) {
//		res.json({
//			code: 1,
//			TagModel: TagModel,
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
////更新标签
//exports.update=function(req,res,next){
//	let TagModel = req.body.TagModel,
//		id = TagModel._id,
//		name = TagModel.name;
//		
//	TagModel.findOne({
//		name: name
//	}).then(function(TagModel) {
//		if(TagModel) {
//			throw {
//				code: -1,
//				message: '已有此标签,不可重复'
//			}
//		}
//		return TagModel.update({_id: id}, {name: name}).exec();
//	}).then(function() {
//		res.json({
//			code: 1,
//			message: '更新成功'
//		});
//	}).catch(function(err) {
//		console.log('标签更新失败:' + err);
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
////删除标签
//exports.remove=function(req,res,next){
//	let id = req.params['id'];
//	TagModel.remove({
//		_id: id
//	}).exec(function(err) {
//		res.json({
//			code: 1,
//			message: '删除成功'
//		});
//	});
//}

