/*
 * 留言控制器
 */
"use strict";
import path from 'path'
import fs  from 'fs'
import _  from 'underscore'
import mongoose from 'mongoose'

//数据模型
const WordModel = mongoose.model("Word");

class WordObj{
	constructor(){
		
	}
	
	async getWords(req,res,next){
		try{
			const words=await WordModel.find({"state.isRead":false}).populate('user','username');
			res.json({
				code:1,
				words:words,
				message:'获取留言成功'
			});
		}catch(err){
			next(err);
		}
	}
	
	async add(req,res,next){
		let newWord=new WordModel({
			message:req.body.content,
			user:req.session["User"]._id
		});
		
		try{
			await newWord.save();
			res.json({
				code:1,
				message:'留言成功'
			});
		}catch(err){
			console.log("留言失败:"+err);
			next(err);
		}
	}
	
	async reply(req,res,next){
		let	{_id,replyContent}=req.body;
		
		try{
			await WordModel.update({_id: _id},{
					$set: {
						"reply.user": req.session['manager']._id,
						"reply.content": replyContent,
						"reply.replyTime": new Date(),
						"state.isRead": true,
						"state.isReply": true
					}
				})
			res.json({
				code: 1,
				message: '留言回复成功'
			});
		}catch(err){
			console.log(err);
			next(err);
		}
	}
	
	
	
	
}

export default new WordObj()







//获取留言
//exports.getWords=function(req,res,next){
//	Word.find({"state.isRead":false}).populate('user','username').exec(function(err,words){
//		if(err){
//			return next(err);
//		}
//		res.json({
//			code:1,
//			words:words,
//			message:'获取留言成功'
//		})
//	})
//}
//

//添加留言
//exports.add=function(req,res,next){
//	let word=new Word({
//		message:req.body.content,
//		user:req.session["User"]._id
//	});
//	word.save(function(err){
//		if(err){
//			console.dir("留言失败:"+err);
//			return next(err);
//		}
//		res.json({
//			code:1,
//			message:'留言成功'
//		});
//	});
//}
//
//
////留言回复
//exports.reply=function(req,res,next){
//	let id = req.body.id,
//		content = req.body.replyContent;
//	Word.update({
//		_id: id
//	}, {
//		$set: {
//			"reply.user": req.session['manager']._id,
//			"reply.content": content,
//			"reply.replyTime": new Date(),
//			"state.isRead": true,
//			"state.isReply": true
//		}
//	}).exec(function(err) {
//		if(err) {
//			console.log(err);
//			next(err);
//		}
//		res.json({
//			code: 1,
//			message: '留言回复成功'
//		});
//	});
//}
//
////删除留言
//exports.remove=function(req,res,next){
//
//}

