"use strict";
import apiRouter from './api'
import adminRouter from './admin'
import indexRouter from './client'
import userRouter from './user'
import ue from './ue' 

export default app => {
	
	app.use(function(req,res,next){
		let _user=req.session['User'];
		if(_user){
			app.locals.user=_user;
		}else{
			app.locals.user=undefined;
		}	
		next();
	});

	app.use("/ueditor/ue",ue)
	app.use('/',indexRouter);
	app.use('/',userRouter);
	app.use('/admin',adminRouter)
	app.use('/api',apiRouter);
//	app.all('/api/*',Auth.checkAdmin);
}
