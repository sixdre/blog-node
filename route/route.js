"use strict";

//api接口
const apiRouter=require('./api');
//后台
const adminRouter=require('./admin');

//网站
const indexRouter=require('./client');
const userRouter=require('./user');
const uploadRouter=require('./upload');
import Auth from '../middleware/auth'
module.exports=function(app){
	
	app.use(function(req,res,next){
		let _user=req.session['User'];
		if(_user){
			app.locals.user=_user;
		}else{
			app.locals.user=undefined;
		}	
		next();
	});
	
	app.use('/',indexRouter);
	app.use('/',userRouter);
	
	app.use('/admin',adminRouter)
//	app.all('/api/*',Auth.checkAdmin);
	app.use('/api',apiRouter);
	app.use('/api/upload',uploadRouter);
}
