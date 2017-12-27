"use strict";
//用户操作验证
import jwt  from  "jsonwebtoken"
import md5  from 'md5'
import validator from 'validator'
import config from '../config/config'
const secret = config.secret;

//数据模型
import UserModel from '../models/user.model'	
class Check {
	constructor() {

	}
	
	async check(req,res,next){
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
				req.session["User"] = user;
				var token = jwt.sign(user, 'app.get(superSecret)', {
		            'expiresIn': 1440 // 设置过期时间
		        });
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
	
	setToken(data){
	    let token = jwt.sign(data, secret, {
	      	expiresIn: '24h' 	//24h
	    })
	    return token;
	}
	
	checkToken(req,res,next){
	 	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	        
	    if(token) {//存在token，解析token
	      	jwt.verify(token, secret , function(err,decoded) {
		        if(err) {
		            // 解析失败直接返回失败警告
		          	return res.status(401).json({success:false,msg:'token验证失败',err})
		        }else {
		            //解析成功加入请求信息，继续调用后面方法
		          	req.userInfo = decoded;
		          	next()
		        }
	      	})
	    }else {
	      	return res.status(401).json({success:false,msg:"token验证失败"})
	    }
	}
	
	checkAdmin(req, res, next) {
		if(!req.session['manager']) {
			return res.status(403).json({ message: '请重新登陆' })
			//		return res.sendStatus(403)
		}
		//res.setHeader('AUTH', 'admin')
		next();
	}

	checkLoginByAjax(req, res, next) {
		if(!req.session["User"]) {
			return res.status(403).json({ message: '请重新登陆' })
		}
		next();
	}

	checkLoginByNative(req, res, next) {
		if(!req.session["User"]) {
			return res.redirect('login');
		}
		next();
	}

}

export default new Check();