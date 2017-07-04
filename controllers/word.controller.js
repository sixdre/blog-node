/*
 * 留言控制器
 */
"use strict";
import path from 'path'
import fs  from 'fs'
import _  from 'underscore'
import mongoose from 'mongoose'

//数据模型
import WordModel from '../models/word.model'	

class WordObj{
	constructor(){
		
	}
	async getWords(req,res,next){
		try{
			const words=await WordModel.find({"state.isRead":false}).populate('user','username');
			res.json({
				code:1,
				words,
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
		const id = req.params['id'];
		let	replyContent = req.body;
		
		try{
			await WordModel.update({_id: id},{
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

