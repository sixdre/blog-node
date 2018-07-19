import request from 'request';
import crypto from 'crypto'
import config from '../config/config'

const APPKEY = config.ryAppKey;
const AppSecret = config.ryAppSecret
const BASE_URL = 'http://api.cn.ronghub.com/'

function greateParams(){
	let Nonce = 1021283474;
	let Timestamp = Math.round(new Date().getTime()/1000);
	let sha1 = crypto.createHash('sha1');
	let t = sha1.update(AppSecret+Nonce+Timestamp)
	let Signature = t.digest('hex');
	return {
		Nonce,
		Timestamp,
		Signature
	}
}

function greateHeader(){
	let header = greateParams();
	header['content-type'] = "application/x-www-form-urlencoded";
	header['App-Key'] = APPKEY;
	return header;
}

function sendRequest(url,body){
	return new Promise(function(resolve,reject){
		url = BASE_URL+url;
		let {Nonce,Timestamp,Signature} = greateParams();
		request({
	        url: url,
	        method: "POST",
	        headers: greateHeader(),
	        body: body
	    }, function(error, response, body) {
	    	console.log(body)
	        if (!error && response.statusCode == 200&&JSON.parse(body).code=='200') {
	        	resolve(JSON.parse(body))
	        }else{
	        	reject({
	        		code:JSON.parse(body).code,
	        		errorMessage:JSON.parse(body).errorMessage
	        	})
	        }
	    });
	})
}



//获取用户token
export const getToken = function(userId,username,avatar){
	if(!userId){
		throw new Error('userId不得为空')
		return;
	}
	let body = `userId=${userId}&name=${username}&portraitUri=${avatar}`;
	return sendRequest('user/getToken.json',body)
}

//获取用户是否在线
export const checkOnline = function(userId){
	if(!userId){
		throw new Error('userId不得为空')
		return;
	}
	let body = `userId=${userId}`;
	return sendRequest('user/checkOnline.json',body)
}