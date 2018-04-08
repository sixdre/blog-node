/*
 * 用户控制器
 */
"use strict";
import _ from 'underscore'
import validator from 'validator'
import auth from '../../middleware/auth'
import transformTozTreeFormat from '../../utility/tree'
//数据模型

import {UserModel,ArticleModel,CategoryModel,TagModel,WordModel,RoleModel,MenuModel} from '../../models/'


export default class UserObj{
	constructor(){
		
	}

	async getMeInfo(req,res,next){
		const userInfo = req.userInfo;
		const userId = req.userInfo._id;
		try {
			let me = await UserModel.findById(userId).select('-isAdmin -role -password -__v');
			let meArticle = await ArticleModel.find({author:userId,status:2});
			let meAid = meArticle.map(item=>item._id);
			let like_num = await UserModel.count({'likeArts':{'$in':meAid}}); 
			let fans_num = await UserModel.count({'follows':{'$in':[userId]}}); 


			let following_num = me.follows.length
			let collect_art_num = me.collectArts.length
			let like_art_num = me.likeArts.length
			let article_num = meArticle.length

			res.json({
				code:1,
				data:{
					userInfo:me,
					fans_num,			//粉丝数量
					following_num,		//关注数量
					collect_art_num,	//收藏文章数量
					like_art_num, 		//喜欢文章数量
					like_num, 			//收获喜欢
					article_num			//发布文章数量
				},
			});
		} catch (err) {
			return next(err)
		}
	}








	//获取登录用户信息
	async getUserInfo(req,res,next){
		let userInfo = req.userInfo;
		try {
			let menus = await MenuModel.find({},{'__v':0,'meta':0}).sort({'sort':'asc'});
				menus = transformTozTreeFormat(JSON.parse(JSON.stringify(menus)))
			// let words = await WordModel.find({ "state.isRead": false }).populate('user', 'username');
			// let articleTotal = await ArticleModel.count({});
			// let categorys = await CategoryModel.find({});
			// let tags = await TagModel.find({});
			res.json({
				code:1,
				userInfo:userInfo,
				menus:menus
				// articleTotal:articleTotal,			//文章总数
				// words:words,			//留言
				// categorys:categorys,	//文章分类
				// tags:tags				//文章标签
			});
		} catch (err) {
			
		}
	}

	async getList(req,res,next){
		let {skip=0,limit=0} = req.query;
		skip = parseInt(skip);
		limit = parseInt(limit);
		try{
			const total = await	UserModel.count();
			if(!total){
				res.json({ 	
					code: -1,
					message: 'no more'
				});
				return ;
			}
			const users = await UserModel.find({},'-password').populate('role')	//回传值中不含有password
					.skip(skip)
				     .limit(limit);
			res.json({
				code: 1,
				data:users,
				total,
				message: '获取用户列表成功'
			});	
		}catch(err){
			console.log('查询用户列表出错:' + err);
			return next(err);
		}
		
	}

	//获取我关注的作者（用户）
	async getMeFollows(req,res,next){
		let {page=1,limit=20} = req.query;
		let userId = req.userInfo._id;
		try{
			let me = await UserModel.findById(userId);
			let query = {_id:{'$in':me.follows}};
			let results = await UserModel.getListToPage({query,page,limit})
			res.json({
				code:1,
				data:results.data,
				total:results.total,
				limit:results.limit,
				page:results.page,
				message:'获取关注用户成功'
			})

		}catch(err){
			return next(err);
		}

	}

	//获取关注我的用户
	async getMeFans(req,res,next){
		let {page=1,limit=20} = req.query;
		let userId = req.userInfo._id;
		try{
			let query = {'follows':{'$in':[userId]}}
			let results = await UserModel.getListToPage({query,page,limit})

			res.json({
				code:1,
				data:results.data,
				total:results.total,
				limit:results.limit,
				page:results.page,
				message:'获取成功'
			})

		}catch(err){
			return next(err);
		}
	}



	//关注
	async toggleFollow(req,res,next){
		let uid = req.params['id'];
		let userId = req.userInfo._id;
		if (!validator.isMongoId(uid)) {
			res.json({
				code: 0,
				type: 'ERROR_PARAMS',
				message: '用户ID参数错误'
			})
			return 
		}else if(String(uid)===String(userId)){
			res.json({
				code: 0,
				type: 'ERROR_PARAMS',
				message: '您不能关注自己哦'
			})
			return 
		}
		try{
			let toUser = await UserModel.findById(uid);
			if(!toUser){
				return res.json({
					code:0,
					message:'该用户不存在'
				})
			}
			let me = await UserModel.findById(userId);
			let condition,isFollow,count=0;
			let isLikes = me.follows.indexOf(uid);
			if(isLikes !== -1){
				condition = {'$pull':{'follows':uid}};
			  	count = me.follows.length-1;
			  	isFollow = false;
			}else{
				condition = {'$addToSet':{'follows':uid}};
			  	count= me.follows.length+1;
			  	isFollow = true;
			}
			await UserModel.update({ _id: userId}, condition);
			res.json({
				code: 1,
				count:count,
				isFollow:isFollow,
				type: 'SUCCESS_TO_LIKES',
				message: '操作成功'
			});

		}catch(err){
			console.log('点赞失败:'+err);
			return next(err);
		}
	}






	//前台用户注册
	async regist(req,res,next){
		let {username,password,email} = req.body;
		try{
			if (validator.isEmpty(username)) {
				throw new Error('用户名不得为空');
			}else if(validator.isEmpty(password)){
				throw new Error('密码不得为空');
			}else if(validator.isEmpty(email)){
				throw new Error('邮箱不得为空！');
			}else if(!validator.isEmail(email)){
				throw new Error('请输入正确的邮箱！');
			}else if(!validator.isLength(password,{min:3})){
				throw new Error('密码不得小于3位！');
			}
		}catch(err){
			console.log('用户填写参数出错', err.message);
			res.send({
				status: -2,
				type: 'ERROR_PARAMS',
				message: err.message
			});
			return;
		}
		
		try{
			let user =await UserModel.findOne({username:username})
			if(user){
				res.json({
					code:-1,
					message:"用户名已被创建"
				});
				return;
			}
			let newUser=new UserModel({
				username:username,
				password:password,
				email:email
			});
			
			await newUser.save();
			res.json({
				code:1,
				message:"成功注册"
			});

		}catch(err){
			console.log('用户注册失败:' + err);
			return next(err);
		}
		
	}
	
	//前台用户登录
	async login(req,res,next){
		let {username,password} = req.body;
		try{
			if (validator.isEmpty(username)) {
				throw new Error('请输入用户名');
			}else if(validator.isEmpty(password)){
				throw new Error('请输入密码');
			}
		}catch(err){
			console.log('用户填写参数出错', err.message);
			res.send({
				status: -2,
				type: 'ERROR_PARAMS',
				message: err.message
			});
			return;
		}  
		  
		try{
			let user = await UserModel.findOne({username:username});
			if(!user){
				return res.json({
					code:-1,
					message:"该用户没有注册！"
				})
			}

			user.comparePassword(password,function(err, isMatch) {
	            if (err) throw err;
	            if(isMatch){
	            	var token = auth.setToken(JSON.parse(JSON.stringify(user)));
	            	req.session["User"] = user;
						res.json({
							code:1,
							token,
							userInfo:{
								username:user.username,
								avatar:user.avatar
							},
							message:"登录成功！"
						});
	            }else{
	            	res.json({
							code:0,
							message:"密码不正确！"
						})
	            }
	        });

		}catch(err){
			console.log('登录失败:' + err);
			return next(err);
		} 
	}
	
	//后台用户登录
	async admin_login(req,res,next){
		let {username,password} = req.body;
		try{
			if (validator.isEmpty(username)) {
				throw new Error('请输入用户名');
			}else if(validator.isEmpty(password)){
				throw new Error('请输入密码');
			}
		}catch(err){
			console.log('用户填写参数出错', err.message);
			res.send({
				status: -2,
				type: 'ERROR_PARAMS',
				message: err.message
			});
			return;
		}  
		  
		try{
			let user = await UserModel.findOne({username:username})
								.select('email username avatar isAdmin role password');
			if(!user){
				return res.json({
					code:-1,
					message:"该用户没有注册！"
				})
			}else if(user.isAdmin==false){
				return res.json({
					code:-1,
					message:"您还不是管理员，请联系系统管理员"
				})
			}
			user.comparePassword(password,function(err, isMatch) {
	            if (err) throw err;
	            if(isMatch){
	            	var token = auth.setToken(JSON.parse(JSON.stringify(user)));
	            	req.session["Admin"] = user;
						res.json({
							code:1,
							token,
							userInfo:{
								role:'测试',
								username:user.username,
								avatar:user.avatar
							},
							message:"登录成功！"
						});
	            }else{
	            	res.json({
							code:0,
							message:"密码不正确！"
						})
	            }
	        });

		}catch(err){
			console.log('登录失败:' + err);
			return next(err);
		}
		  
	}


	//后台管理用户注册
	async admin_regist(req,res,next){
		let {username,email,password,roleId} = req.body;
		try{
			if (validator.isEmpty(username)) {
				throw new Error('用户名不得为空');
			}else if(validator.isEmpty(password)){
				throw new Error('密码不得为空');
			}else if(validator.isEmpty(email)){
				throw new Error('邮箱不得为空！');
			}else if(!validator.isEmail(email)){
				throw new Error('请输入正确的邮箱！');
			}else if(!validator.isLength(password,{min:3})){
				throw new Error('密码不得小于3位！');
			}
		}catch(err){
			console.log('用户填写参数出错', err.message);
			res.send({
				status: -2,
				type: 'ERROR_PARAMS',
				message: err.message
			});
			return;
		}
		try{
			let user =await UserModel.findOne({username:username})
			if(user){
				res.json({
					code:-1,
					message:"用户名已被创建"
				});
				return;
			}
			let newUser=new UserModel({
				username:username,
				password:password,
				email:email,
				role:roleId,
				isAdmin:true
			});
			await newUser.save();
			res.json({
				code:1,
				message:"成功注册"
			});
		}catch(err){
			console.log('用户注册失败:' + err);
			return next(err);
		}
	}
	

	
	//前台更新用户信息
	async update(req,res,next){
		let userId = req.userInfo._id;
		let id = req.params['id'];
		if(userId!==id){
			return res.json({ 	
				code: 0,
				message: '操作失败'
			});
		}
		try{
			let user = await UserModel.findOne({"_id":id});
			if(!user){
				return res.json({ 	
					code: 0,
					message: '用户不存在或已被删除'
				});
			}
			await _.extend(user,req.body).save();
			return res.json({ 	
				code: 1,
				message: '操作成功'
			});
		}catch(err){
			console.log('更新用户信息失败:' + err);
			return next(err);
		}
	}

	//更新用户角色
	async updateRole(req,res,next){
		const userId = req.params['id'];
		const roleId = req.body.roleId;
		if (!validator.isMongoId(userId)||!validator.isMongoId(roleId)||!roleId) {
			res.json({
				code: 0,
				type: 'ERROR_PARAMS',
				message: '参数有误'
			})
			return 
		}
		try{
			let user = await UserModel.findById(userId);
			let role = await RoleModel.findById(roleId);
			if(!user){
				return res.json({ 	
					code: 0,
					message: '用户不存在或已被删除'
				});
			}else if(!role){
				return res.json({ 	
					code: 0,
					message: '该角色不存在'
				});
			}
			await UserModel.update({'_id':userId},{'role':roleId});
			return res.json({ 	
				code: 1,
				message: '操作成功'
			});
		}catch(err){
			console.log('更新用户角色失败:' + err);
			return next(err);
		}
	}

	async remove(req,res,next){
		const ids = req.params['id'].split(',');
		try{
			let users = await UserModel.find({ _id: { "$in": ids } });
			let pro = users.map((user) =>{
				return new Promise(function(resolve, reject){
					try{
 						UserModel.remove({_id: user._id}).then(()=>{
 							resolve('ok')
 						})
					}catch(err){
						reject(err)
					}
				})
			})
			await Promise.all(pro);
			res.json({
				code: 1,
				message: '删除成功'
			});
			
		}catch(err){
			console.log('删除失败:' + err);
			return next(err);
		}
	}


	
	
	
}




