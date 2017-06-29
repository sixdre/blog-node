"use strict";
import express from 'express'
import session from  'express-session'
import cookieParser  from 'cookie-parser'
import formidable from 'formidable'
import fs from 'fs'							
import path  from 'path'
import favicon  from 'serve-favicon'
import logger from 'morgan'
import bodyParser from 'body-parser'		
import ueditor from "ueditor"	
import moment from 'moment'
import connectmongo from 'connect-mongo'
import md5 from 'md5'
import validator from 'validator'

const  mongoStroe = connectmongo(session);	//connect-mongo用来在数据库存储session的模块
global.moment =moment;
global.md5=md5;					
global.validator =validator;


//配置文件
global.CONFIG=JSON.parse(fs.readFileSync('./config/settings.json').toString());
//数据库连接
const mongoose=require('./config/mongoose.js');
const db=mongoose();

const app = global.app= express();

app.locals.moment=moment;

app.use(cookieParser("xhtest"));
//设置session
app.use(session({
  secret: 'xhtest',
  //name: 'name',			//设置 cookie 中，保存 session 的字段名称，默认为 connect.sid 。
  cookie: {maxAge: 1000 * 60 * 60 * 24}, //有效时间
  saveUninitialized: true,
  resave: false,
  store:new mongoStroe({
	  url: 'mongodb://localhost/blog',
	  collection:'sessions'
  })
}));

//设置模板引擎
app.set('views', path.join(__dirname, 'public'));
app.engine('.html', require('ejs').__express);
//app.engine('.html', require('express-art-template'));
//ejs.open = '{{';
//ejs.close = '}}';
app.set('view engine', 'html');


// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));		//extended为false时，键值对中的值就为'String'或'Array'形式,为true,则可为任何类型
app.use(express.static(path.join(__dirname, 'public')));
//app.use('/static', express.static('public'));
//app.use(express.static(path.join(__dirname, 'upload')));
/*app.use(bodyParser({ uploadDir: "./public/upload" }));*/  


//app.all('*', (req, res, next) => {
//	res.header("Access-Control-Allow-Origin", req.headers.origin);
//	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
//	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
//	res.header("Access-Control-Allow-Credentials", true); //可以带cookies
//	res.header("X-Powered-By", '3.2.1')
//	if (req.method == 'OPTIONS') {
//	  	res.send(200);
//	} else {
//	    next();
//	}
//});

//百度编辑器
app.use("/ueditor/ue", ueditor(path.join(__dirname, 'public'), function (req, res, next) {
    //客户端上传文件设置
     var ActionType = req.query.action;
    if (ActionType === 'uploadimage' || ActionType === 'uploadfile' || ActionType === 'uploadvideo') {
        var file_url = '/upload/ueditor/';//默认图片上传地址
        /*其他上传格式的地址*/
        if (ActionType === 'uploadfile') {
            file_url = '/upload/file/ueditor/'; //附件
        }
        if (ActionType === 'uploadvideo') {
            file_url = '/upload/video/ueditor/'; //视频
        }
        res.ue_up(file_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
        res.setHeader('Content-Type', 'text/html');
    }
    //  客户端发起图片列表请求
    else if (req.query.action === 'listimage') {
        var dir_url = '/upload/ueditor/';
        res.ue_list(dir_url); // 客户端会列出 dir_url 目录下的所有图片
  
    }
    // 客户端发起其它请求
    else {
        res.setHeader('Content-Type', 'application/json');
        res.redirect('/ueditor/nodejs/config.json');
    }
}));

//页面路由控制
const routes = require('./route/route.js');				
routes(app);	

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});



// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
  	console.log(err);
    res.status(err.status || 500);
    res.render('www/error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('www/error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;

