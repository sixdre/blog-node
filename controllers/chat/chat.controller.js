/*
 * 用户控制器
 */
"use strict";
import assert from 'assert'
import jwt  from  "jsonwebtoken"
import validator from 'validator'
import {UserModel,MessageModel,SocketModel} from '../../models/'
import * as RongIMLib from '../../services/RongIMLib.service'
import config from '../../config/config'

const secret = config.secret;
const EachFetchMessagesCount = 30;


function formatMessages(messages,from){
	let list = messages.map(function(message){
		return {
			_id:message.id,
			sendTime:message.createTime,
			senderUserId:message.from._id,
			sender:{
            	username:message.from.username,
            	avatar:message.from.avatar
            },
            target:message.to,
            messageDirection:String(message.from._id)==from?1:2,
            content:message.content
		}
	})

	return list;
}




export default class Chat {


	async loginByToken(data,socket){
		const {
            token, os, browser, environment,
        } = data;
        assert(token, 'token不能为空');
        let payload = null;
        try {
            payload = jwt.decode(token, secret);
            console.log(payload.exp)
        } catch (err) {
            return '非法token';
        }
        assert(Date.now()/1000 < payload.exp, 'token已过期');
        const user = await UserModel.findOne({ _id: payload._id }, { _id: 1, avatar: 1, username: 1 });
        assert(user, '用户不存在');
        socket.user = user._id;

        return {
            _id: user._id,
            avatar: user.avatar,
            username: user.username,
            groups:[],
            friends:[],
        };
	}


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
        let socketUser;
        try{
        	socketUser = await UserModel.findById(socket.user).select('username avatar');
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
            type,
            sendTime: newMessage.createTime,
            senderUserId:socket.user,
            sender:{
            	username:socketUser.username,
            	avatar:socketUser.avatar
            },
            target:{
            	username:user.username,
            	avatar:user.avatar
            },
            messageDirection:1,
            content:messageContent
        };

        return messageData;

	}

	//获取与某一用户的历史消息记录
	async getHistoryMessagesByTarget(data,socket) {
        const {type, targetId, limit=20,timestrap } = data;
        const from = socket.user;

        let messages;
        try{
        	messages = await MessageModel
            .find(
                { to: targetId,from:from },
                { type: 1, content: 1, from: 1, createTime: 1 },
                { sort: { createTime: -1 }, limit: EachFetchMessagesCount + limit },
            )
            .populate('from', { username: 1, avatar: 1 });
        }catch(err){
        	throw err;
        }
        const result = formatMessages(messages,from);
        // const result = messages.slice(limit).reverse();
        // console.log(result)
        return result;
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





