/*
 * 文件控制器
 */
"use strict";
import http from 'http'
import request from 'request'
import path from 'path'
import fs from 'fs'
import UploadComponent from '../../prototype/upload'
//数据模型
import {FileModel,BannerModel} from '../../models/'

const tool = require('../../utility/tool');

export default class FileObj extends UploadComponent{
	constructor(){
		super()
		this.addFile = this.addFile.bind(this)
	}
	
	async get(req,res,next){		
		let { page = 1, limit = 10} = req.query;
		page = parseInt(page);
		limit = parseInt(limit);

		const count = await FileModel.count();
		let data = await FileModel.find({},{'__v':0}).skip(limit * (page-1)).limit(limit).sort({create_time:-1});
		res.json({
			code: 1,
			data,
			count
		})
	}
	
	async addFile(req,res,next){
		if(!req.files||!req.files.length){
			res.json({
				code:-2,
				type:'NOT FILE',
				message:'请选择文件'
			});
			return ;
		}
		try{
			let Pro = req.files.map(item=>{
				return new Promise((resolve, reject) => {
					return this.upload(item).then(function(url){
						FileModel.create({
							filename:item.filename,
							filesize:item.size,
							filetype:item.mimetype,
							filepath:url
						}).then(function(){
							resolve(url)
						})
					}).catch(err=>{
						reject(err)
					})
				})
			})
			let fileurl = await Promise.all(Pro);
			if(fileurl.length===1&&req.files.length===1){
				fileurl=fileurl[0]
			}
			res.json({
				code:1,
				url:fileurl,
				message:'文件上传成功'
			});
		}catch(err){
			console.log('保存文件出错'+err);
			return 	next(err);
		}
	}
	
	async addBanner(req,res,next){
		if(!req.file) {
			res.json({
				code: -2,
				message:'请选择上传图片'
			});
			return;
		}
		let nameArray = req.file.originalname.split('.')
		let type = nameArray[nameArray.length - 1];
		let typeArray = ["jpg", "png", "gif", "jpeg"];
		if(tool.contain(typeArray, type) && tool.checkUrl(req.body.link)) {
			try{
				let imgurl = await this.upload(req.file);
				let banner = new BannerModel({
					dec: req.body.dec,
					url: req.body.link,
					weight: req.body.weight,
					imgAdress: imgurl
				});
				await banner.save();
				res.json({
					code: 1,
					message: '添加成功'
				});
			}catch(err){
				console.log("banner save err:", err);
				return next(err);
			}
		} else {
			res.json({
				code: -1,
				type: 'FORM_DATA_ERROR',
				message: '参数错误'
			});
		}
	}
	
	
	async download(req,res,next){
		let id = req.query.id;
		if(!id){
			return res.json({
				code:0,
				msg:'参数缺失'
			})
		}

		try{
			let file = await FileModel.findById(id);
			if(!file){
				return res.json({
					code:0,
					msg:'文件不存在或已被删除'
				})
			}
			let realPath = file.filepath;
			let OriginalName = file.filename;

			var stream = fs.createWriteStream('./'+OriginalName);

			request(realPath).pipe(stream).on('close', function(){
				console.log(OriginalName+'下载完毕');
			
			}); 


			// let body;
			// http.request({ host: "localhost", port: 7893, method: "get", path: realPath}, function (resp) {
   //             resp.on("data", function (d) {
   //             	console.log(d)
   //                 body=d;//Uint8Array
   //             }).on("end", function () {
   //                 //设置响应内容类型为文件流,浏览器端表现为下载文件
   //                 res.contentType("application/octet-stream");
   //                 //设置文件名，注意名称需要进行url编码
   //                 res.setHeader("Content-Disposition", "attachment;filename=" + encodeURI(OriginalName));
   //                 //结束本次请求，输出文件流
   //                 res.end(body);
   //             });
   //          }).on("error", function () {
   //             res.sendStatus(500);
   //          }).end();
		}catch(err){

		}
		

		//res.download(realPath);
		
		
	
		
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



