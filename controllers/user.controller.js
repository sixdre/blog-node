/*
 * 用户控制器
 */
"use strict";
import path from 'path'
import fs from 'fs'
import _ from 'underscore'
import mongoose from 'mongoose'
import md5  from 'md5'


//数据模型
const UserModel = mongoose.model("User");

class UserObj{
	constructor(){
		
	}
	async getUsers(req,res,next){
		try{
			let users = await User.findAll();
			res.json({
				code: 1,
				users: users,
				message: '获取用户列表成功'
			});
		}catch(err){
			console.log('查询用户列表出错:' + err);
			next(err);
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
			next(err);
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
			}else if(user&&user.password!==md5(password)){
				res.json({
					code:0,
					message:"用户密码不正确！"
				})
			}else{
				req.session["User"] = user;
				res.json({
					code:1,
					message:"登录成功！"
				});
//				res.redirect('back');
			}
		}catch(err){
			next(err);
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
			console.log('注册失败:'+err);
			next(err);
		}
	}
	
	
	async admin_login(req,res,next){
		let {username,password} = req.body;

		try{
			let manager=await UserModel.findOne({username:username});
			console.log(manager)
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
			}else{
				req.session["manager"] = manager;
				res.json({
					code : 1,
					message:'登陆成功'	//登陆成功
				});			
			}
		}catch(err){
			console.log('登陆出错:'+err);
			next(err);
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







//获取用户
//exports.getUsers=function(req,res,next){
//	User.findAll().then(function(users) {
//		res.json({
//			code: 1,
//			users: users,
//			message: '获取用户列表成功'
//		})
//	}).catch(function(err) {
//		console.log('查询用户列表出错:' + err);
//		next(err);
//	})
//}
//
////用户注册
//exports.regist=function(req,res,next){
//	let username=req.body.username,
//	  password=req.body.password,
//	  email=req.body.email;
//	let user=new User({
//		username:username,
//		password:md5(password),
//		email:email
//	});
//	if(validator.isEmpty(username)){
//		res.json({
//			code:-2,
//			message:"用户名不得为空！"
//		});
//	}else if(validator.isEmpty(password)){
//		res.json({
//			code:-2,
//			message:"密码不得为空！"
//		});
//	}else if(validator.isEmpty(email)){
//		res.json({
//			code:-2,
//			message:"邮箱不得为空！"
//		});
//	}else if(!validator.isEmail(email)){
//		res.json({
//			code:-2,
//			message:"请输入正确的邮箱！"
//		});
//	}else if(!validator.isLength(password,{min:3})){
//		res.json({
//			code:-2,
//			message:"密码不得小于3位！"
//		});
//	}else{
//		User.findOne({username:username},function(err,result){
//			if(err){
//				console.dir("查询出错");
//				return next(err);
//			}else if(result){
//				res.json({
//					code:-1,
//					message:"用户名已被创建"
//				});
//			}else{
//				user.save(function(err){
//					if(err){
//						console.dir("保存用户出错"+err);
//						return next(err);
//					}
//					res.json({
//						code:1,
//						message:"成功注册"
//					});
//				});
//			}
//		});
//	}
//}
//
////用户登录
//exports.login=function(req,res,next){
//	let username=req.body.username,
//	  password=req.body.password;
//	if(validator.isEmpty(username)){
//		res.json({
//			code:-2,
//			message:"请输入用户名！"
//		});
//	}else if(validator.isEmpty(password)){
//		res.json({
//			code:-2,
//			message:"请输入密码！"
//		});
//	}else{
//		User.findOne({username:username},function(err,user){
//			if(err){
//				console.dir("查询出错");
//				next(err);
//			}else if(!user){
//				res.json({
//					code:-1,
//					message:"该用户没有注册！"
//				})
//			}else if(user&&user.password!==md5(password)){
//				res.json({
//					code:0,
//					message:"用户密码不正确！"
//				})
//			}else{
//				req.session["User"] = user;
//				res.json({
//					code:1,
//					message:"登录成功！"
//				});
////				res.redirect('back');
//			}
//		})	
//	}
//}
//
////用户退出
//exports.logout=function(req,res,next){
//	delete req.session['User'];
//	delete app.locals.user;
//	res.json({
//		code:1,
//		message:'退出登陆成功'
//	});
//}
//
//
//
////管理员注册
//exports.admin_regist=function(req,res,next){
//	let manager = new User({
//		username: req.body.username,
//		email:req.body.email,
//		password: md5(req.body.password)
//	});
//	User.findOne({isAdmin:true}).exec().then(function(user1){
//		if(user1){
//			throw {
//				code:-1,
//				message:'已有超级管理员，不可重复创建'
//			};
//		}
//		return User.findOne({username:req.body.username}).exec();
//	}).then(function(user2){
//			if(user2){
//				throw {
//					code:-2,
//					message:'该用户名已被注册'
//				};
//			}
//			manager.isAdmin=true;
//			manager.save().then(function(manager){
//				res.json({
//					code:1,
//					message:'成功创建超级管理员！'
//				});
//			});
//	}).catch(function(err){
//		console.log('注册失败:'+err);
//		if(err.code){
//			return res.json({
//				code:err.code,
//				message:err.message
//			});
//		}
//		next(err);
//	});
//}
//
////管理员登录
//exports.admin_login=function(req,res,next){
//	let username=req.body.username;
//	let password=req.body.password;
//	User.findOne({username:username}).then(function(manager){
//		if(!manager|| !manager.isAdmin){
//			res.json({
//				code:-1,
//				message:'账号不存在'
//		    });
//		}else if(manager.password == md5(password)){
//			req.session["manager"] = manager;
//			res.json({
//				code : 1,
//				message:'登陆成功'	//登陆成功
//			});			
//		}else{
//			res.json({
//				code : -2,
//				message:'密码错误'	//密码错误
//			});			
//		}
//	}).catch(function(err){
//		console.log('登陆出错:'+err);
//		next(err);
//	})
//}
//
////管理员退出
//exports.admin_logout=function(req,res,next){
//	delete req.session['manager'];
//	res.json({
//		code:1,
//		message:'退出登陆成功'
//	});
//}
//
//
////删除用户
//exports.remove=function(req,res,next){
//	
//}

