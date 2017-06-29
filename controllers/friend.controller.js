/*
 * 友情链接控制器
 */
"use strict";
import path from 'path'
import fs from 'fs'
import _ from 'underscore'
import mongoose from 'mongoose'

//数据模型
const FriendModel = mongoose.model("Friend");

class FriendObj{
	constructor(){
		
	}
	async getFriends(req,res,next){
		let {page=1,limit=parseInt(CONFIG.FriendLimit)} = req.query;
		
		limit=parseInt(limit);
		
		try{
			const total = await FriendModel.count({});
			const allPage = Math.ceil(total/limit);
			if(page>allPage){
				page=1;
			}
			const friends = await FriendModel.find({}).sort({'sort':-1})
								.skip((page-1)*limit).limit(limit);
			res.json({
				code:1,
				allPage:allPage,
				current_page:page,
				friends:friends||[]
			})

		}catch(err){
			next(err);
		}
	}
	
	async add(req,res,next){
		let {title,url,sort} = req.body;
		
		if(!title||!url){
			res.send({
				code: 0,
				type: 'ERROR_PARAMS',
				message:'请输入信息'
			})
			return ;
		}
		
		try{
			let friend = await FriendModel.findOne({title: title});
			if(friend){
				throw new Error('已有此标签,不可重复')
			}
		}catch(err){
			console.log('已有此标签,不可重复');
			res.send({
				code: -2,
				type: 'ERROR_TO_ADD_FRIEND',
				message: err.message
			})
			return;
		}
	
		try{
			let newFriend = new FriendModel({title: title,url: url,sort: sort});
			let friend = await newFriend.save();
			res.json({
				code: 1,
				friend: friend,
				message: '添加成功'
			});
		}catch(err){
			console.log('添加失败'+err);
			next(err);
		}
	}
	
	async update(req,res,next){
		let {_id,title,url,sort} = req.body;

		try{
			await FriendModel.update({
				_id:_id
			}, {
				"title": title,
				"url": url,
				"sort": sort,
				"meta.update_time": new Date()
			});
			res.json({
				code: 1,
				message: '更新成功'
			});
			
		}catch(err){
			console.log('更新失败:' + err);
			next(err);
		}
	}
	
	async remove(req,res,next){
		let id = req.params['id'];
		if(!id){
			res.send({
				code: 0,
				type: 'ERROR_PARAMS'
			})
			return ;
		}
		try{
			await FriendModel.remove({_id: id});
			res.json({
				code: 1,
				message: '删除成功'
			});
		}catch(err){
			console.log('友链删除失败:' + err);
			next(err);
		}
	}
}


export default new FriendObj();








////获取友情链接
//exports.getFriends=function(req,res,next){
//	let page=parseInt(req.query.page)||1;		//当前页
//	let limit=parseInt(req.query.limit)||parseInt(CONFIG.FriendLimit);	//每页数量
//	async.waterfall([
//		function(cb){
//			Friend.count({}).exec(function(err,total){
//				let allPage=Math.ceil(total/limit);
//				cb(null,allPage);
//			})
//		},
//		function(allPage,cb){
//			if(page>allPage){
//				page=1;
//			}
//			Friend.find({}).sort({'sort':-1}).skip((page-1)*limit)
//				.limit(limit).exec(function(err,friends){
//				cb(null,allPage,friends);
//			})
//		}
//	],function(err,allPage,friends){
//		if(err){
//			return next(err);
//		}
//		res.json({
//			code:1,
//			allPage:allPage,
//			current_page:page,
//			friends:friends||[]
//		})
//	})
//}
//
////添加友情链接
//exports.add=function(req,res,next){
//	const title = req.body.title,
//		url = req.body.url,
//		sort = req.body.sort;
//		
//	let friend = new Friend({
//		title: title,
//		url: url,
//		sort: sort
//	});
//	Friend.findOne({
//		title: title
//	}).then(function(doc) {
//		if(doc) {
//			throw {
//				code: -2,
//				message: '该友链已经添加过了'
//			}
//		}
//		return friend.save();
//	}).then(function(doc) {
//		res.json({
//			code: 1,
//			friend: doc,
//			message: '添加成功'
//		});
//	}).catch(function(err) {
//		console.log('友链添加出错:' + err);
//		if(err.code) {
//			return res.json({
//				code: err.code,
//				message: err.message
//			})
//		}
//		next(err);
//	})
//}
//
//
////更新友情链接
//exports.update=function(req,res,next){
//	const id = req.body._id,
//		title = req.body.title,
//		url = req.body.url,
//		sort = req.body.sort;
//	Friend.update({
//		_id: id
//	}, {
//		"title": title,
//		"url": url,
//		"sort": sort,
//		"meta.update_time": Date.now()
//	}).then(function() {
//		res.json({
//			code: 1,
//			message: '更新成功'
//		});
//	}).catch(function(err) {
//		console.log('update err :' + err);
//		next(err);
//	});
//}
//
////删除友情链接
//exports.remove=function(req,res,next){
//	let id = req.params['id'];
//	Friend.remove({
//		_id: id
//	}).then(function() {
//		res.json({
//			code: 1,
//			message: '删除成功'
//		});
//	}).catch(function(err) {
//		console.log('友链删除失败:' + err);
//		next(err);
//	});
//}

