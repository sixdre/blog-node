"use strict";
import express from 'express'
import UserCtrl from '../controllers/user.controller'

const router = express.Router();

//登陆页面
router.get('/login',function(req,res,next){
	res.render("www/login",{
		title:"用户登录"
	});
})
//注册页面
router.get('/regist',function(req,res,next){
	res.render("www/regist",{
		title:"用户注册"
	});
})

//登陆
router.post('/login',UserCtrl.login);
//注册
router.post('/regist',UserCtrl.regist);
//退出
router.get('/logout',UserCtrl.logout);


//管理员登陆
router.post('/admin_login',UserCtrl.admin_login);
//管理员注册
router.post('/admin_regist',UserCtrl.admin_regist)
//管理员退出
router.get('/admin_logout',UserCtrl.admin_logout)



export default router;














