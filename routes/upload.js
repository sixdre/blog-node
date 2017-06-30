"use strict";
import express from 'express'
import multer from 'multer'
import mongoose from 'mongoose'
import moment from 'moment'

import BannerModel from '../models/banner.model'
import FileCtrl from '../controllers/file.controller'

const tool = require('../utility/tool');
const router = express.Router();

const storage = multer.diskStorage({
	//设置上传文件路径,以后可以扩展成上传至七牛,文件服务器等等
	//Note:如果你传递的是一个函数，你负责创建文件夹，如果你传递的是一个字符串，multer会自动创建
	destination: "public/upload/" + moment(Date.now()).format('YYYY-MM'),
	//  destination: function (req, file, cb) {
	//      cb(null, 'public/upload/'+file.fieldname+'/'+moment(Date.now()).format('YYYY-MM'))
	//  }, 
	limits: {
		fileSize: 100000000
	},
	//TODO:文件区分目录存放
	//获取文件MD5，重命名，添加后缀,文件重复会直接覆盖
	filename: function(req, file, cb) {
		var fileFormat = (file.originalname).split(".");
		cb(null, file.fieldname + '-' + Date.now() + "." + fileFormat[fileFormat.length - 1]);
	}
});

//添加配置文件到muler对象。
const upload = multer({
	storage: storage,
})

//上传文件
router.post('/addFile', upload.single('file'), FileCtrl.addFile);

//首页banner图的添加
router.post('/addBanner', upload.single('banner'), function(req, res, next) {
	if(!req.file) {
		res.json({
			code: -2
		});
		return;
	}
	let banner = BannerModel({
		dec: req.body.dec,
		url: req.body.link,
		weight: req.body.weight,
		imgAdress: req.file.path.substring(6)
		//			imgAdress:req.file.destination.substring(6)+"/"+req.file.filename
	});

	let nameArray = req.file.originalname.split('.')
	let type = nameArray[nameArray.length - 1];

	let typeArray = ["jpg", "png", "gif", "jpeg"];

	if(tool.contain(typeArray, "jpg") && tool.checkUrl(req.body.link) && req.body.dec.length) {

		banner.save(function(err, doc) {
			if(err) {
				return console.log("banner save err:", err);
			}
			res.json({
				code: 1,
				message: '添加成功'
			});
		})
	} else {
		res.json({
			code: -1,
			message: '添加失败'
		});
	}
})

export default router;