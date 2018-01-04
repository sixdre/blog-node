/*
 * 留言控制器
 */
"use strict";

//数据模型
import {WordModel} from '../models/'

class WordObj{
	constructor(){
		
	}
	async getWords(req,res,next){
		//read(0)表示为未读
		//read(1)表示为已读
		//reply(0)表示为未回复
		//reply(1)表示为已回复
		let read = req.query.read;
		let reply = req.query.reply;
		let query = {};
		try{
			if(read == '0'){
				query.isRead = false;
			}else if(read == '1'){
				query.isRead = true;
			}
			if(reply=='0'){
				query.isReply= false;
			}else if(reply=='1'){
				query.isReply= true;
			}
			const words = await WordModel.find(query).populate('user','username');
			res.json({
				code:1,
				data:words,
				query,
				message:'获取留言成功'
			});
		}catch(err){
			console.log('获取留言失败'+err);
			return next(err);
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
			console.log('添加留言失败'+err);
			return next(err);
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
			console.log('留言回复失败'+err);
			return next(err);
		}
	}
	
	
	
	
}

export default new WordObj()

