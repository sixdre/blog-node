/*
 * 用户控制器
 */
"use strict";
import moment from 'moment'
import _ from 'underscore'
import assert from 'assert'
import jwt  from  "jsonwebtoken"
import validator from 'validator'
import {UserModel,MessageModel,SocketModel,ConversationModel,GroupModel} from '../../models/'
import * as RongIMLib from '../../services/RongIMLib.service'
import config from '../../config/config'

const secret = config.secret;

const ConversationType = {
    PRIVATE:1,      //私聊
    GROUP:2    //群组
};


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
    constructor(socket,onlineUsers) {
        this.socket = socket
        this.onlineUsers = onlineUsers
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
   

    //token 登录
	async loginByToken(data){
        var onlineUsers = this.onlineUsers;
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
        this.socket.user = String(user._id);

        const groups = await GroupModel.find({ members: user }, { _id: 1, name: 1, avatar: 1, creator: 1, createTime: 1 });
        groups.forEach((group) => {
            this.socket.join(group._id);
            return group;
        });

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


    //用户在线
    async online(){
        var onlineUsers = this.onlineUsers;
        const socket = this.socket;
        onlineUsers[socket.user] = socket.id;

        let conversations = await ConversationModel.find({ 'links': { '$in': [socket.user] }});
        conversations.forEach(function(con){
            let socketId = onlineUsers[String(con.from)];
            if(socketId){
                global.io.to(socketId).emit('online',socket.user);
            }
        })
    }

    //用户离线
    async offline(){
        const socket = this.socket;
        var onlineUsers = this.onlineUsers;

        let conversations = await ConversationModel.find({ 'links': { '$in': [socket.user] }});
        conversations.forEach(function(con){
            let socketId = onlineUsers[String(con.from)];
            if(socketId){
                global.io.to(socketId).emit('offline',socket.user);
            }
        })
        delete onlineUsers[socket.user];
    }


	//发送消息
	async sendMessage(data){
		const { to, type, content,conversationType = 1 } = data;
        const socket = this.socket;
		let messageContent = content;

        assert((String(to)!=String(socket.user)),'您不能与自己对话');
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
            if(conversationType == ConversationType.PRIVATE){           //私聊
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

                messageData =  {
                    _id: newMessage._id,
                    createTime:newMessage.createTime,
                    type,
                    sendTime:moment(newMessage.createTime).format('YYYY-MM-DD HH:mm:ss'),
                    senderUserId:socket.user,
                    sender:{
                        username:socketUser.username,
                        avatar:socketUser.avatar
                    },
                    target:to,
                    messageDirection:1,
                    content:messageContent
                };
                var sockets = []
                for(var key in this.onlineUsers){
                    if(key==String(user._id)){
                        sockets.push(this.onlineUsers[key])
                    }
                }
                sockets.forEach((item) => {
                    global.io.to(item).emit('receiveMessage',{
                        ...messageData,
                        messageDirection:2
                    });
                });

            }else if(conversationType == ConversationType.GROUP){
                assert(validator.isMongoId(to),'群组ID参数错误')
                let group = await GroupModel.findOne({ _id: to });
                assert(group, '群组不存在');
                newMessage = await MessageModel.create({
                    from: socket.user,
                    to,
                    type,
                    content: messageContent,
                })
                messageData = {
                    _id: newMessage._id,
                    createTime:newMessage.createTime,
                    type,
                    sendTime:moment(newMessage.createTime).format('YYYY-MM-DD HH:mm:ss'),
                    senderUserId:socket.user,
                    sender:{
                        username:socketUser.username,
                        avatar:socketUser.avatar
                    },
                    target:to,
                    messageDirection:1,
                    content:messageContent
                };
                socket.to(to).emit('receiveMessage', {
                    ...messageData,
                    messageDirection:2
                });
            }

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
            // conversationList = _.sortBy(conversationList,function(con){
            //     return -con.online; 
            // });
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

	//获取历史消息记录
	async getHistoryMessages(data) {
        const {type, targetId,page=1,conversationType=1, limit=20,timestrap } = data;
        const socket = this.socket;
        const from = socket.user;
        let hasMore = true;
        let messages;

        

        try{
            let query = {};
            if(conversationType==ConversationType.PRIVATE){
                query = { to: {'$in':[targetId,from]},from:{'$in':[targetId,from]} }
               
            }else if(conversationType==ConversationType.GROUP){
                query = { to: targetId}
            }
            let count = await MessageModel.count(query);
            messages = await MessageModel.find(query,
                            { type: 1, content: 1, from: 1, createTime: 1 },
                            { sort: { createTime: -1 }},
                        ).skip((Number(page)-1)*limit).limit(limit).populate('from', { username: 1, avatar: 1 });

            if(count<(Number(page)*limit)){
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





