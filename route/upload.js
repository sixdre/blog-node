"use strict";
const express = require('express');
const router = express.Router();
const events = require('events');	
const fs = require('fs');
const path = require('path');
const multer = require ('multer');  //上传文件中间件 multer
const mongoose=require('mongoose');
const tool=require('../utility/tool');

//数据模型
const File = mongoose.model('File');			
const Banner=mongoose.model("Banner");

//控制器
const FileCtrl=require('../controllers/file.controller');

const storage = multer.diskStorage({
    //设置上传文件路径,以后可以扩展成上传至七牛,文件服务器等等
    //Note:如果你传递的是一个函数，你负责创建文件夹，如果你传递的是一个字符串，multer会自动创建
    destination: "public/upload/"+moment(Date.now()).format('YYYY-MM'),
//  destination: function (req, file, cb) {
//      cb(null, 'public/upload/'+file.fieldname+'/'+moment(Date.now()).format('YYYY-MM'))
//  }, 
    limits: {
	    fileSize: 100000000
	},
    //TODO:文件区分目录存放
    //获取文件MD5，重命名，添加后缀,文件重复会直接覆盖
    filename: function (req, file, cb) {
        var fileFormat =(file.originalname).split(".");
        cb(null, file.fieldname + '-' + Date.now() + "." + fileFormat[fileFormat.length - 1]);
    }
});

//添加配置文件到muler对象。
const upload = multer({
    storage: storage,
})

//router.use(function(req,res,next){
//	if(!req.session["manager"]){
//		let err = new Error('错误');
//		err.status = 401;
//		next(err);
//		console.log(123);
////		return res.status(401).json({
//	
//});
//	}
//	next();
//})/

//上传文件
router.post('/addFile',upload.single('file'),FileCtrl.addFile);


//首页banner图的添加
router.post('/addBanner',upload.single('banner'),function(req,res,next){
	if(!req.file){
		res.json({
			code:-2
		});
		return ;
	}
	let banner = Banner({
		dec:req.body.dec,
		url: req.body.link,
		weight:req.body.weight,
		imgAdress:req.file.path.substring(6)
//			imgAdress:req.file.destination.substring(6)+"/"+req.file.filename
	});
	
	let nameArray=req.file.originalname.split('.')
	let type=nameArray[nameArray.length-1];
	
	let typeArray=["jpg","png","gif","jpeg"];

	if(tool.contain(typeArray,"jpg")&&tool.checkUrl(req.body.link)&&req.body.dec.length){
	
		banner.save(function(err,doc){
			if(err){
				return console.log("banner save err:",err);
			}
			res.json({
				code:1,
				message:'添加成功'
			});
		})
	}else{
		res.json({
			code:-1,
			message:'添加失败'
		});
	}
})





module.exports = router;

