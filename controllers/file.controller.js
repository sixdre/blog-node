/*
 * 文件控制器
 */
"use strict";
import http from 'http'
import path from 'path'
import fs from 'fs'
import multer from 'multer' //上传文件中间件 multer
import mongoose from 'mongoose'
import UploadComponent from '../prototype/upload'
//数据模型
import FileModel from '../models/file.model'	
import BannerModel from '../models/banner.model'

const tool = require('../utility/tool');

class FileObj extends UploadComponent{
	constructor(){
		super()
		this.addFile = this.addFile.bind(this)
	}
	
	getFiles(req,res,next){		//待开发
		res.json({
			code: 1
		})
	}
	
	async addFile(req,res,next){
		if(!req.file){
			res.json({
				code:-2,
				message:'请选择文件'
			});
			return ;
		}
		let {filename,size,path} = req.file;

		try{
			let fileurl = await this.upload(req);
			const newfile=new FileModel({
				filename:filename,
				filesize:size,
				filepath:fileurl
			});
			await newfile.save();
			res.json({
				code:1,
				message:'文件上传成功'
			});
		}catch(err){
			console.log('保存文件出错'+err);
			next(err);
		}
	}
	
	async addBanner(req,res,next){
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
	}
	
	
	download(req,res,next){
		console.log("文件存在");
		let realPath = 'http://osf6cl53d.bkt.clouddn.com/file-1498981281347.jpg';
		let OriginalName = 'file-1498981281347.jpg'
		let body;
		//res.download(realPath);
		
		 http.request({ host: "localhost", port: 7893, method: "get", path: realPath}, function (resp) {
               resp.on("data", function (d) {
                   body=d;//Uint8Array
               }).on("end", function () {
                   //设置响应内容类型为文件流,浏览器端表现为下载文件
                   res.contentType("application/octet-stream");
                   //设置文件名，注意名称需要进行url编码
                   res.setHeader("Content-Disposition", "attachment;filename=" + encodeURI(OriginalName));
                   //结束本次请求，输出文件流
                   res.end(body);
               });
           }).on("error", function () {
               res.sendStatus(500);
           }).end();
		
		
		
//		fs.readFile(realPath, "binary", function (err, file) {
//		    if (err) {
//		        res.writeHead(500, {
//		            'Content-Type': 'text/plain'
//		        });
//		        console.log("读取文件错误");
//		        res.end(err);
//		    } else {
//		        res.writeHead(200, {
//		            'Content-Type': 'text/html'
//		        });
//		        console.log("读取文件完毕，正在发送......");
//		        res.write(file, "binary");
//		        res.end();
//		        console.log("文件发送完毕");
//		    }
//		});
	}
	
	
}

export default new FileObj();

