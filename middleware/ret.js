export default () => {
    return (req, res, next) => {
        //数据错误
	    res.retError = function (message,status){
	        let retBody = {
	            code:0,
	        }
	        if(typeof message ==='string'){
	            retBody.message = message;
	        }else if(typeof message ==='object'){
	            retBody = {
	                code:0,
	                ...message
	            }
	        }
	        if(status){
	            return res.status(status).json(retBody)
	        }else{
	            return res.json(retBody)
	        }
	    }

	    //参数错误
	    res.retErrorParams = function (message){
	        return res.retError({
	            message,
	            type:'ERROR_PARAMS'
	        });
	    }
	    //404
	    res.retNotFund = function (message){
	        return res.retError({
	            message,
	            type:'NOT FOUND'
	        },404);
	    }
	    //success
	    res.retSuccess = function (data="操作成功"){
	        if(typeof data ==='string'){
	            return res.json({
	                code:1,
	                message:data
	            })
	        }else if(typeof data ==='object'){
	            return res.json({
	                code:1,
	                message:'操作成功',
	                ...data
	            })
	        }
	    }
	    next();
    }
}