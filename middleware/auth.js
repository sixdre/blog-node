"use strict";
//用户操作验证
import jwt  from  "jsonwebtoken"
import md5  from 'md5'
import validator from 'validator'

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
		

//		var t1 = req.headers['authorization']
//		
//		var content ={msg:"today  is  a  good  day"}; // 要生成token的主题信息
//		var secretOrPrivateKey="I am a goog man!" // 这是加密的key（密钥） 
//		var token = jwt.sign(content, secretOrPrivateKey, {
//		                    expiresIn: 60*60*24  // 24小时过期
//		               });
//		console.log("token ：" +token );
//		
//		console.log(t1)
//		jwt.verify(t1, secretOrPrivateKey, function (err, decode) {
//          if (err) {  //  时间失效的时候/ 伪造的token          
//             res.json({err:err})
//          } else {
//          	console.log(decode)
//             
//             
//          }
//      })
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