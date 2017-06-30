"use strict";
import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import favicon from 'serve-favicon'
import logger from 'morgan'
import bodyParser from 'body-parser'
import moment from 'moment'
import connectMongo from 'connect-mongo'
import md5 from 'md5'
import validator from 'validator'
import config from './config/config'


global.moment = moment;
global.md5 = md5;
global.validator = validator;
//配置文件
global.CONFIG = JSON.parse(fs.readFileSync('./config/settings.json').toString());

////数据库连接
const db = require('./config/db.js')();
const app = global.app = express();

app.locals.moment = moment;

const mongoStroe = connectMongo(session); //connect-mongo用来在数据库存储session的模块
app.use(cookieParser());

//设置session
app.use(session({
	secret: config.session.secret,
	name: config.session.name, 		//设置 cookie 中，保存 session 的字段名称，默认为 connect.sid 
	cookie: config.session.cookie, 	//有效时间
	saveUninitialized: false,
	resave: true,
	store: new mongoStroe({
		url: config.mongodb,
		collection: 'sessions'
	})
}));

//设置模板引擎
app.set('views', path.join(__dirname, 'public'));
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');


app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); //extended为false时，键值对中的值就为'String'或'Array'形式,为true,则可为任何类型
app.use(express.static(path.join(__dirname, 'public')));


//routes 
const routes = require('./routes');
routes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	let err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// development error handler
// will print stacktrace
if(app.get('env') === 'development') {
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