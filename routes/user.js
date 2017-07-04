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

export default router;














