"use strict";

import path from 'path'
import ueditor from "ueditor"
export default ueditor(path.join(__dirname,'../')+'public',(req, res, next) => {
		let ActionType = req.query.action;
		if(ActionType === 'uploadimage' || ActionType === 'uploadfile' || ActionType === 'uploadvideo') {
			var file_url = '/upload/ueditor/'; //默认图片上传地址
			/*其他上传格式的地址*/
			if(ActionType === 'uploadfile') {
				file_url = '/upload/file/ueditor/'; //附件
			}
			if(ActionType === 'uploadvideo') {
				file_url = '/upload/video/ueditor/'; //视频
			}
			res.ue_up(file_url); //保存操作交给ueditor来做
			res.setHeader('Content-Type', 'text/html');
		}
		//  客户端发起图片列表请求
		else if(req.query.action === 'listimage') {
			var dir_url = '/upload/ueditor/';
			res.ue_list(dir_url); // 客户端会列出 dir_url 目录下的所有图片
		}
		// 客户端发起其它请求
		else {
			res.setHeader('Content-Type', 'application/json');
			res.redirect('/ueditor/nodejs/config.json');
		}
})





