import path from 'path'
import fs from 'fs'
import bytes from 'bytes'
import qiniu from 'qiniu'
import multer from 'multer'
import config from '../config/config'

//qiniu.conf.ACCESS_KEY = config.qiniu_config.accessKey;
//qiniu.conf.SECRET_KEY = config.qiniu_config.secretKey;

const storage = multer.memoryStorage()



//var ACCESS_KEY = config.qiniu_config.accessKey;
//var SECRET_KEY = config.qiniu_config.secretKey;
//var mac = new qiniu.auth.digest.Mac(ACCESS_KEY, SECRET_KEY);
//
//var key =  "test1.txt";
//var options = {
//scope: 'myblog',
//}
//var putPolicy = new qiniu.rs.PutPolicy(options);
//
//var token = putPolicy.uploadToken(mac);
//
//var config11 = new qiniu.conf.Config();
//config11.zone = qiniu.zone.Zone_z1;
//
//var formUploader = new qiniu.form_up.FormUploader(config11);
//var putExtra = new qiniu.form_up.PutExtra();
//var localFile = "public/upload/2017-06/file-1498836330738.jpg";
//
////fs.writeFile(key, "hello world!好的，你好", function(err) {
////  if(err) {
////      return console.log(err);
////  }
////  console.log("The file was saved!");
////  uploadFile();
////});
//var key='filessss.jpg';
//
//function uploadFile() {
// formUploader.putFile(token, '111sss1.jpg', localFile, putExtra, function(respErr, respBody,respInfo) {
//      if (respErr) {
//	    throw respErr;
//	  }
//		console.log(respBody)
//		console.log(respInfo)
//	  if (respInfo.statusCode == 200) {
//	    console.log(respBody);
//	  } else {
//	    console.log(respInfo.statusCode);
//	    console.log(respBody);
//	  }
//  });
//}
//uploadFile()


export default class BaseComponent {
	constructor(){
		this.qiniu_config = config.qiniu_config
		this.upload = this.upload.bind(this)
		this.qiniu = this.qiniu.bind(this)
	}
	
	
	upload(req, type='img'){
		return new Promise((resolve,reject)=>{
			if(!req.file){
				reject('请选择文件');
			}
			const key = req.file.filename;
			const repath = req.file.path;
			const token = this.uptoken(this.qiniu_config.bucket);
			this.qiniu(token.toString(), key, repath).then(function(refile){
				fs.unlink(repath);
				resolve(refile)
			},function(err){
				console.log('保存至七牛失败', err);
				fs.unlink(repath)
				reject('保存至七牛失败')
			})
		})
	}
	uptoken(bucket, key){
		const options = {
		  scope: bucket,
		}
		let putPolicy = new qiniu.rs.PutPolicy(options);
		let mac = new qiniu.auth.digest.Mac(this.qiniu_config.accessKey, this.qiniu_config.secretKey);
		return putPolicy.uploadToken(mac);
	}
	qiniu(uptoken, key, localFile){
		let origin = this.qiniu_config.origin;
		return new Promise((resolve, reject) => {
			let QNconfig = new qiniu.conf.Config();
				QNconfig.zone = qiniu.zone.Zone_z1;
			const putExtra = new qiniu.form_up.PutExtra();
			const formUploader = new qiniu.form_up.FormUploader(QNconfig);
		     formUploader.putFile(uptoken, key, localFile, putExtra, function(respErr, respBody,respInfo) {
		     	if (respErr) {
				    console.log('文件上传至七牛失败', respErr);
			    	    reject(err)
				}
				if (respInfo.statusCode == 200) {
				     resolve(origin+respBody.key)
				} else {
				    console.log(respInfo.statusCode);
				    resolve(origin+respBody.key)
				}
		  	});

		})
	}
	

	
	
}


//export default new BaseComponent()
