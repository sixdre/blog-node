"use strict";
import apiRouter from './api'
import sysRouter from './sys'
import adminRouter from './admin'
import chatRouter from './chat'
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
	app.use('/admin',adminRouter)
	app.use('/api',apiRouter);
	app.use('/sys',sysRouter);
	app.use('/chat',chatRouter);
//	app.all('/api/*',Auth.checkAdmin);
}
