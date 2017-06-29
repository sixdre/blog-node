"use strict";
//用户操作验证

class Check{
	constructor(){
		
	}
	
    checkAdmin(req,res,next){
		if(!req.session['manager']){	
			return res.status(403).json({ message: '请重新登陆' })
	//		return res.sendStatus(403)
		}
		//res.setHeader('AUTH', 'admin')
		next();
	}
	
	checkLoginByAjax(req,res,next){
		if(!req.session["User"]){
	      return res.status(403).json({ message: '请重新登陆' })
	    }
		next();
	}
	
	checkLoginByNative(req,res,next){
		if(!req.session["User"]){
			return res.redirect('login');
		}
		next();
	}
	
}

export default new Check();








/*
 * 后台操作检查
 */
//exports.checkAdmin=function(req,res,next){
//	if(!req.session['manager']){	
//		return res.status(403).json({ message: '请重新登陆' })
////		return res.sendStatus(403)
//	}
//	//res.setHeader('AUTH', 'admin')
//	next();
//}
///*
// * 对ajax请求进行用户状态检查
// */
//exports.checkLoginByAjax=function(req,res,next){
//	if(!req.session["User"]){
//    return res.status(403).json({ message: '请重新登陆' })
//  }
//	next();
//}
///*
// * 对表单请求或者链接跳转进行用户状态检查
// */
//exports.checkLoginByNative=function(req,res,next){
//	if(!req.session["User"]){
//		return res.redirect('login');
//	}
//	next();
//}
//
