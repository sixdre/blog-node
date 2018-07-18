/*
 * 用户控制器
 */
"use strict";
import _ from 'underscore'
import validator from 'validator'
import auth from '../../middleware/auth'
import transformTozTreeFormat from '../../utility/tree'
import jwt  from  "jsonwebtoken"
import config from '../../config/config'
import UploadComponent from '../../prototype/upload'
import {UserModel,ArticleModel,CategoryModel,TagModel,WordModel,RoleModel,MenuModel} from '../../models/'
import {validateUserName} from '../../services/user.service'
const tool = require('../../utility/tool');

const secret = config.secret;

//数据模型

export default class UserObj extends UploadComponent{
	constructor(){
		super()
		this.updateAvatar = this.updateAvatar.bind(this)
	}
	//更新用户头像
	async updateAvatar(req,res,next){
		const userId = req.userInfo._id;
		try{
			if(!req.file){
				return res.retErrorParams('请选择头像')
			}
			let nameArray = req.file.originalname.split('.')
			let type = nameArray[nameArray.length - 1];
			if(!tool.checkUploadImg(type)) {
				return res.retErrorParams('请上传图片格式的文件')
			}
			let url = await this.upload(req.file);
			await UserModel.update({ _id: userId}, {avatar:url});
			res.retSuccess({
				url
			})
		}catch(err){
			return next(err)
		}
		
	}


	//更新用户设置
	async updateSetting(req,res,next){
		const userId = req.userInfo._id;
		let {setting,username} = req.body;
		if(!validateUserName(username)||!username){
			return res.retErrorParams('用户名不合法')
		}
		try{
			let user = await UserModel.findOne({'_id':{$ne:userId},'username':username});
			if(user){
				return res.retError('用户名已存在')
			}
			await UserModel.update({ _id: userId}, {username,setting});
			res.retSuccess()
		}catch(err){
			return next(err)
		}
	}


	//获取用户信息
	async getInfoById(req,res,next){
		const userId = req.params['id'];
		const userInfo = req.userInfo;
		const meId = req.userInfo?req.userInfo._id:null;
		const isMe = String(meId) === String(userId);
		if (!validator.isMongoId(userId)) {
			return res.retNotFund('用户ID参数错误');
		}
		try {
			let user = await UserModel.findById(userId).select('-isAdmin -role -password -__v');
			if(!isMe){
				if(!user||user.setting.show_main===2){
					return res.retNotFund('您要查找的用户不存在，或者该用户开启了私密设置');
				}
			}
			let userArticle = await ArticleModel.find({author:userId,status:2});
			let userAid = userArticle.map(item=>item._id);
			let like_num = await UserModel.count({'likeArts':{'$in':userAid}}); 
			let fans_num = await UserModel.count({'follows':{'$in':[userId]}}); 


			let following_num = user.follows.length
			let collect_art_num = user.collectArts.length
			let like_art_num = user.likeArts.length
			let article_num = userArticle.length



			res.retSuccess({
				data:{
					isMe,
					userInfo:user,
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
		const userId = req.userInfo._id;
		let {type = ''} = req.query;
		try {
			let menus = await MenuModel.find({},{'__v':0,'meta':0}).sort({'sort':'asc'});
				menus = transformTozTreeFormat(JSON.parse(JSON.stringify(menus)))
			let userInfo = null;
			if(type==='basic'){			//获取基本信息
				userInfo = await UserModel.findById(userId).select('username avatar email create_time');
			}else if(type==='setting'){
				userInfo = await UserModel.findById(userId).select('username avatar email setting create_time');
			}else{
				userInfo = await UserModel.findById(userId);
			}

			userInfo = JSON.parse(JSON.stringify(userInfo))

			userInfo.loginIp = tool.getClientIP(req);

			// let words = await WordModel.find({ "state.isRead": false }).populate('user', 'username');
			// let articleTotal = await ArticleModel.count({});
			// let categorys = await CategoryModel.find({});
			// let tags = await TagModel.find({});
			res.retSuccess({
				userInfo,
				data:userInfo,
				menus:menus,
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
			const users = await UserModel.find({},'-password').populate('role')	//回传值中不含有password
					.skip(skip)
				     .limit(limit);
			res.retSuccess({
				data:users,
				total
			});	
		}catch(err){
			console.log('查询用户列表出错:' + err);
			return next(err);
		}
		
	}

	//获取用户关注的作者（用户）
	async getFollowsById(req,res,next){
		let {page=1,limit=20} = req.query;
		const userId = req.params['id'];
		const meId = req.userInfo?req.userInfo._id:null;
		const isMe = String(meId) === String(userId);
		if (!validator.isMongoId(userId)) {
			res.retErrorParams('用户ID参数错误')
			return 
		}
		try{
			let user = await UserModel.findById(userId);
			if(!isMe){
				if(!user||user.setting.show_main===2){
					res.retNotFund('您要查找的用户不存在，或者该用户开启了私密设置')
					return ;
				}
			}
			let query = {_id:{'$in':user.follows}};
			let results = await UserModel.getListToPage({query,page,limit})
			res.retSuccess({
				isMe,
				data:results.data,
				total:results.total,
				limit:results.limit,
				page:results.page
			})

		}catch(err){
			return next(err);
		}

	}

	//获取用户的关注
	async getFansById(req,res,next){
		let {page=1,limit=20} = req.query;
		const userId = req.params['id'];
		const meId = req.userInfo?req.userInfo._id:null;
		const isMe = String(meId) === String(userId);
		if (!validator.isMongoId(userId)) {
			res.retErrorParams('用户ID参数错误')
			return 
		}
		try{
			let user = await UserModel.findById(userId).select('-isAdmin -role -password -__v');
			if(!isMe){
				if(!user||user.setting.show_main===2){
					res.retNotFund('您要查找的用户不存在，或者该用户开启了私密设置')
					return 
				}
			}
			let query = {'follows':{'$in':[userId]}}
			let results = await UserModel.getListToPage({query,page,limit})

			res.retSuccess({
				isMe,
				data:results.data,
				total:results.total,
				limit:results.limit,
				page:results.page
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
			res.retErrorParams('用户ID参数错误')
			return 
		}else if(String(uid)===String(userId)){
			res.retError('您不能关注自己哦')
			return 
		}
		try{
			let toUser = await UserModel.findById(uid);
			if(!toUser){
				return res.retError('该用户不存在')
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
			res.retSuccess({
				count:count,
				isFollow:isFollow
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
			}else if(!validateUserName(username)){
				throw new Error('用户名不合法');
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
			res.retErrorParams(err.message);
			return;
		}
		
		try{
			let user =await UserModel.findOne({username:username})
			if(user){
				res.retError('用户名已被创建');
				return;
			}
			let newUser=new UserModel({
				username:username,
				password:password,
				email:email
			});
			
			await newUser.save();
			res.retSuccess();

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
			res.retErrorParams(err.message);
			return;
		}  
		  
		try{
			let user = await UserModel.findOne({username:username});
			if(!user){
				return res.retError('该用户没有注册！');
			}

			user.comparePassword(password,function(err, isMatch) {
	            if (err) throw err;
	            if(isMatch){
	            	var token = auth.setToken(JSON.parse(JSON.stringify({
	            		_id:user._id,
	            		username:user.username,
	            		email:user.email,
	            		isAdmin:user.isAdmin
	            	})));
	            	var {exp,iat} = jwt.decode(token, secret);
	            	req.session["User"] = user;
					res.retSuccess({
						token,
						exp,
						iat,
						userInfo:{
							_id:user._id,
							username:user.username,
							avatar:user.avatar
						},
					});
	            }else{
	            	res.retError('密码不正确！')
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
			res.retErrorParams(err.message);
			return;
		}  
		  
		try{
			let user = await UserModel.findOne({username:username})
								.select('email username avatar isAdmin role password');
			if(!user){
				return res.retError('该用户没有注册！'); 
			}else if(user.isAdmin==false){
				return res.retError('您还不是管理员，请联系系统管理员'); 
			}
			user.comparePassword(password,function(err, isMatch) {
	            if (err) throw err;
	            if(isMatch){
	            	var token = auth.setToken(JSON.parse(JSON.stringify({
	            		_id:user._id,
	            		username:user.username,
	            		email:user.email,
	            		isAdmin:user.isAdmin
	            	})));
	            	req.session["Admin"] = user;
	            	res.retSuccess({
						token,
						userInfo:{
							role:'测试',
							username:user.username,
							avatar:user.avatar,
							_id:user._id
						},
					});
	            }else{
	            	res.retError('密码不正确！')
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
			}else if(!validateUserName(username)){
				throw new Error('用户名不合法');
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
			res.retErrorParams(err.message);
			return;
		}
		try{
			let user =await UserModel.findOne({username:username})
			if(user){
				res.retError('用户名已被创建');
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
			res.retSuccess();
		}catch(err){
			console.log('用户注册失败:' + err);
			return next(err);
		}
	}
	

	
	//前台更新用户信息
	async update(req,res,next){
		let userId = req.userInfo._id;
		let id = req.params['id'];
		let {username} = req.body;
		if(userId!==id){
			return res.retError('不允许修改他人信息');
		}

		if(!validateUserName(username)||!username){
			throw new Error('用户名不合法');
			return res.retErrorParams('用户名不合法')
		}
		try{
			let user = await UserModel.findOne({"_id":id});
			if(!user){
				return res.retError('用户不存在或已被删除');
			}
			await _.extend(user,req.body).save();
			res.retSuccess();
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
			return res.retErrorParams('参数有误')
		}
		try{
			let user = await UserModel.findById(userId);
			let role = await RoleModel.findById(roleId);
			if(!user){
				return res.retError('用户不存在或已被删除');
			}else if(!role){
				return res.retError('该角色不存在');
			}
			await UserModel.update({'_id':userId},{'role':roleId});
			res.retSuccess();
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
			res.retSuccess();
		}catch(err){
			console.log('删除失败:' + err);
			return next(err);
		}
	}


	
	
	
}




