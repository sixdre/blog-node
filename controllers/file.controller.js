/*
 * 文件控制器
 */
"use strict";
import path from 'path'
import fs from 'fs'
import multer from 'multer' //上传文件中间件 multer
import mongoose from 'mongoose'

//数据模型
const FileModel = mongoose.model("File");

class FileObj{
	constructor(){
		
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

		const newfile=new FileModel({
			filename:filename,
			filesize:size,
			filepath:path.substring(6)
		});
		try{
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
	
	download(req,res,next){
		console.log("文件存在");
		let realPath = 'public/upload/banner/2017-05/file-1493975809800.jpg';
		res.download(realPath);
		//fs.readFile(realPath, "binary", function (err, file) {
		//    if (err) {
		//        res.writeHead(500, {
		//            'Content-Type': 'text/plain'
		//        });
		//        console.log("读取文件错误");
		//        res.end(err);
		//    } else {
		//        res.writeHead(200, {
		//            'Content-Type': 'text/html'
		//        });
		//        console.log("读取文件完毕，正在发送......");
		//        res.write(file, "binary");
		//        res.end();
		//        console.log("文件发送完毕");
		//    }
		//});
	}
	
	
}

export default new FileObj();

