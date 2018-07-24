/*
 * 用户控制器
 */
"use strict";
import moment from 'moment'
import _ from 'underscore'
import assert from 'assert'
import jwt  from  "jsonwebtoken"
import validator from 'validator'
import {UserModel,MessageModel,SocketModel,ConversationModel} from '../../models/'
import * as RongIMLib from '../../services/RongIMLib.service'
import config from '../../config/config'

const secret = config.secret;
var fetchPage = 0;

function formatMessages(messages,from){
	let list = messages.map(function(message){
		return {
			_id:message.id,
            createTime:message.createTime,
			sendTime:moment(message.createTime).format('YYYY-MM-DD HH:mm:ss'),
			senderUserId:message.from._id,
            type:message.type,
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
    constructor(socket) {
        this.socket = socket
    }


    async createSocket(data){
        var socket = this.socket;
        await SocketModel.create({
            id: socket.id
        });
    }

    async removeSocket(data){
        var socket = this.socket;
        await SocketModel.remove({
            id: socket.id,
        });
    }
   





	async loginByToken(data){
		const {
            token, os, browser, environment,
        } = data;
        assert(token, 'token不能为空');
        let payload = null;
        try {
            payload = jwt.decode(token, secret);
        } catch (err) {
            return '非法token';
        }
        assert(Date.now()/1000 < payload.exp, 'token已过期');
        const user = await UserModel.findOne({ _id: payload._id }, { _id: 1, avatar: 1, username: 1 });
        assert(user, '用户不存在');
        this.socket.user = user._id;

        await SocketModel.update({ id: this.socket.id }, {
            user: user._id,
            os,
            browser,
            environment,
        });
        return {
            _id: user._id,
            avatar: user.avatar,
            username: user.username,
            groups:[],
            friends:[],
        };
	}


	//发送消息
	async sendMessage(data){
		const { to, type, content } = data;
        const socket = this.socket;
		let messageContent = content;
		assert(to,'to参数不得为空')
		
        if (type === 'Text') {
        	assert(messageContent.length <= 2048,'消息长度过长')
        }
        let newMessage;
        let user;
        let socketUser;
        let messageData;
        try{
        	socketUser = await UserModel.findById(socket.user).select('username avatar');
        	user = await UserModel.findById(to).select('username avatar');
        	newMessage = await MessageModel.create({
        		from: socket.user,
                to,
                type,
                content: messageContent,
        	})
            
            let conversationFrom = await ConversationModel.find({from:socket.user});
            let conversationTo = await ConversationModel.find({from:to});
            if(!conversationFrom.length){
                ConversationModel.create({
                    from:socket.user,
                    links:[to]
                })
            }else{
                await ConversationModel.update({from:socket.user},{'$addToSet': { 'links': to }});
            }

            if(!conversationTo.length){
                ConversationModel.create({
                    from:to,
                    links:[socket.user]
                })
            }else{
                await ConversationModel.update({from:to},{'$addToSet': { 'links':socket.user }});
            }

            messageData = {
                _id: newMessage._id,
                type,
                sendTime:moment(newMessage.createTime).format('YYYY-MM-DD HH:mm:ss'),
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
            const sockets = await SocketModel.find({ user: user._id });
            sockets.forEach((item) => {
                global.io.to(item.id).emit('receiveMessage',{
                    ...messageData,
                    messageDirection:2
                });
            });
        }catch(err){
        	throw err;
        }

        return messageData;
	}


    //获取会话列表
    async getConversationList(){
        const socket = this.socket;
        let conversationList = []
        try{
            let conversation = await ConversationModel.findOne({from:socket.user}).populate('links','username avatar')
            let sockets = global.io.sockets.sockets;

            let pro = conversation.links.map(function(item){
                return new Promise(async function(resolve,reject){
                    let online = Object.values(sockets).find(function(soc){
                        return String(soc.user) == String(item._id);
                    })
                    let unreadMessageCount = await MessageModel.find({from:item._id,to:socket.user,readStatus:0}).count();
                    let latestMessages = await MessageModel.find({from:item._id,to:socket.user}).sort({'createTime':-1})
                                            .limit(1).populate('from', { username: 1, avatar: 1 });
                    resolve({
                        online:online?1:0,
                        userId:item._id,
                        username:item.username,
                        avatar:item.avatar,
                        _id:item._id,
                        latestMessage:formatMessages(latestMessages,item._id)[0],
                        unreadMessageCount
                    })
                })
            });
            conversationList = await Promise.all(pro)
            conversationList = _.sortBy(conversationList,function(con){
                return -con.online; 
            });
        }catch(err){
            throw err;
        }
        return conversationList;
    }

    //清除消息会话未读数
    async clearUnreadCount(data){
        const {targetId} = data;
        const socket = this.socket;
        try{
            await MessageModel.update({from:targetId,to:socket.user},{readStatus:1},{ multi: true })
        }catch(err){
            throw err;
        }
        return true;
    }

	//获取与某一用户的历史消息记录
	async getPrivateHistoryMessages(data) {
        const {type, targetId,page=1, limit=20,timestrap } = data;
        const socket = this.socket;
        const from = socket.user;
        let hasMore = true;
        let messages;
        try{
           messages = await MessageModel
            .find(
                { to: {'$in':[targetId,from]},from:{'$in':[targetId,from]} },
                { type: 1, content: 1, from: 1, createTime: 1 },
                { sort: { createTime: -1 }},
            ).skip((Number(page)-1)*limit).limit(limit)
            .populate('from', { username: 1, avatar: 1 });
            if(!messages.length){
                hasMore = false;
            }else{
                hasMore = true;
            }
        }catch(err){
        	throw err;
        }
        const result = _.sortBy(formatMessages(messages,from), function(item) {
          return item.createTime;
        });
        return {
            hasMore,
            list:result
        };
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





