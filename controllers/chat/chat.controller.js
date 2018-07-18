/*
 * 用户控制器
 */
"use strict";
import {UserModel} from '../../models/'
import * as RongIMLib from '../../services/RongIMLib.service'


export default class Chat {

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
	    	},function(){

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





