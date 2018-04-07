import path from 'path'
import fs from 'fs'
import qiniu from 'qiniu'
import config from '../config/config'

export default class UploadComponent {
	constructor(){
		this.qiniu_config = config.qiniu_config
		this.upload = this.upload.bind(this)
		this.qiniu = this.qiniu.bind(this)
	}
	
	upload(file){
		return new Promise((resolve,reject)=>{
			if(!file){
				reject('请选择文件');
			}
			const key = file.filename;
			const repath = file.path;
			const token = this.uptoken(this.qiniu_config.bucket);
			this.qiniu(token.toString(), key, repath).then(function(refileurl){
				resolve(refileurl);
				fs.unlink(repath)
			},function(err){
				console.log('保存至七牛失败', err);
				fs.unlink(repath)
				reject('保存至七牛失败');
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
			    	    reject(respErr)
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


