"use strict";
//后台管理路由
import express from 'express'
const router = express.Router();

router.get('/',function(req,res,next){
	res.render('admin', {
		title: '',
	});
})



export default router;











