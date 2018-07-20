/*
 * 用户控制器
 */
"use strict";
import assert from 'assert'
import validator from 'validator'
import {UserModel,MessageModel,SocketModel} from '../../models/'
import * as RongIMLib from '../../services/RongIMLib.service'


export default class Chat {

	//发送消息
	async sendMessage(data,socket){
		const { to, type, content } = data;
		let messageContent = content;
		assert(to,'to参数不得为空')
		
        if (type === 'Text') {
        	assert(messageContent.length <= 2048,'消息长度过长')
        }
        let newMessage;
        let user;
        try{
        	user = await UserModel.findById(to).select('username avatar');
        	newMessage = await MessageModel.create({
        		from: socket.user,
                to,
                type,
                content: messageContent,
        	})
        }catch(err){
        	throw err;
        }

        const messageData = {
            _id: newMessage._id,
            createTime: newMessage.createTime,
            from: user.toObject(),
            to,
            type,
            content: messageContent,
            user:socket.user
        };

        return messageData;

	}


































	//获取融云token
	async getRongToken(req,res,next){
		const userId = req.userInfo._id;
		try{
			let user = await UserModel.findById(userId).select('username avatar email');
			RongIMLib.getToken(user._id,user.username,user.avatar).then(function(body){
	    		res.retSuccess({
	    			ryToken:body.token,
	    			username:user.username,
	    			id:user._id,
	    			avatar:user.avatar,
	    			email:user.email
				});
	    	},function(err){
	    		res.retError({
	    			code:err.code,
	    			message:err.errorMessage
				});
	    	})
		}catch(err){
			return next(err)
		}
		
	}



	//获取当前聊天室用户信息
	async getChatUserInfo(req,res,next){
		const userIds = req.params['userId'];
		try{
			let uids = userIds.split(',');
			let users = await UserModel.find({'_id':{'$in':uids}}).select('username avatar'); 
			let pro = users.map(function(item){
				return new Promise(function(resolve,reject){
					RongIMLib.checkOnline(item._id).then(function(body){
						let su = {
							username:item.username,
							userId:item._id,
			    			avatar:item.avatar,
							online:body.status
						}
						resolve(su)
			    	},function(){
			    		reject()
			    	})
				})
			})
			let d = await Promise.all(pro);
			res.retSuccess({
    			data:d
			});

		}catch(err){
			return next(err)
		}
	}




}





