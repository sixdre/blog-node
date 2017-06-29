/*
 * 文件控制器
 */
"use strict";
const path = require('path');
const fs = require('fs');
const multer = require('multer'); //上传文件中间件 multer
const mongoose = require('mongoose');

//数据模型
const File = mongoose.model("File");
const Banner=mongoose.model("Banner");


//获取文件
exports.getFiles=function(req,res,next){
	res.json({
		code: 1
	})
}

//上传文件
exports.addFile=function(req,res,next){
	if(req.file){
		let file=new File({
			filename:req.file.filename,
			filesize:req.file.size,
			filepath:req.file.path.substring(6)
		});
		file.save(function(err,file){
			if(err){
				console.log('保存文件出错'+err);
				return next(err);
			}
			res.json({
				code:1,
				message:'文件上传成功'
			})
		})
	}else{
		res.json({
			code:-2,
			message:'请选择文件'
		})
	}
}

//下载文件
exports.download=function(req,res,next){
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



//删除文件
exports.remove=function(req,res,next){

}

