/*
 * 用户控制器
 */
"use strict";
import md5  from 'md5'
import validator from 'validator'
import auth from '../middleware/auth'
//数据模型

import {UserModel,ArticleModel,CategoryModel,TagModel,WordModel} from '../models/'


class UserObj{
	constructor(){
		
	}
	async getUsers(req,res,next){
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
			const users = await UserModel.find({},'-password')	//回传值中不含有password
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
				msg: '删除成功'
			});
			
		}catch(err){
			console.log('删除失败:' + err);
			return next(err);
		}
	}


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
				password:md5(password),
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
				res.json({
					code:-1,
					message:"该用户没有注册！"
				})
			}else if(user.password!==md5(password)){
				res.json({
					code:0,
					message:"密码不正确！"
				})
			}else{
				var token = auth.setToken(JSON.parse(JSON.stringify(user)));
				req.session["User"] = user;
				res.json({
					code:1,
					token,
					message:"登录成功！"
				});
//				res.redirect('back');
			}
		}catch(err){
			console.log('登录失败:' + err);
			return next(err);
		}
		  
	}
	
	logout(req,res,next){
		delete req.session['User'];
		delete app.locals.user;
		res.json({
			code:1,
			message:'退出登陆成功'
		});
	}
	
	async admin_regist(req,res,next){
		
		let {username,email,password} = req.body;
		
		try{
			let m1 =await UserModel.findOne({isAdmin:true});
			let m2 = await UserModel.findOne({username:username});
			if(m1){
				res.json({
					code:-1,
					message:'已有超级管理员，不可重复创建'
				});
				return ;
			}
			if(m2){
				res.json({
					code:-2,
					message:'该用户名已被注册'
				});
				return ;
			}
			let manager = new UserModel({
				username: username,
				email:email,
				password: md5(password)
			});
			manager.isAdmin=true;
			await manager.save();
			res.json({
				code:1,
				message:'成功创建超级管理员！'
			});
		}catch(err){
			console.log('创建超级管理员失败:' + err);
			return next(err);
		}
	}
	
	
	async admin_login(req,res,next){
		let {username,password} = req.body;
		try{
			let manager = await UserModel.findOne({ username: username }, ['username', 'password', 'email','create_time','isAdmin']);
			//返回指定字段 或者使用下面
			//{username:1,password:1,email:1,create_time:1,isAdmin:1}
			if(!manager|| !manager.isAdmin){
				res.json({
					code:-1,
					message:'账号不存在'
			    });
			}else if(manager.password !== md5(password)){
				res.json({
					code : -2,
					message:'密码错误'	//密码错误
				});			
			} else {
				var token = auth.setToken(JSON.parse(JSON.stringify(manager)));
				req.session["manager"] = manager;
				res.json({
					code : 1,
					token,
					role:{
						name:'测试'
					},
					message:'登陆成功'	//登陆成功
				});			
			}
		}catch(err){
			console.log('管理员登陆出错:' + err);
			return next(err);
		}
	}
	
	//获取登录用户信息
	async getUserInfo(req,res,next){
		let userInfo = req.userInfo;
		try {
			let words = await WordModel.find({ "state.isRead": false }).populate('user', 'username');
			let articleTotal = await ArticleModel.count({});
			let categorys = await CategoryModel.find({});
			let tags = await TagModel.find({});
			res.json({
				code:1,
				userInfo:userInfo,
				articleTotal:articleTotal,			//文章总数
				words:words,			//留言
				categorys:categorys,	//文章分类
				tags:tags				//文章标签
			});
		} catch (err) {
			
		}
	}
	
	
	
	//管理员退出
	admin_logout(req,res,next){
		delete req.session['manager'];
		res.json({
			code:1,
			message:'退出登陆成功'
		});
	}
	
}

export default new UserObj()


