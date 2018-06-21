var fs = require('fs');

/**
 * 搜索JSON数组
 * @param jsonArray JSON数组
 * @param conditions 查询条件，如 {"name":"value"}
 * @returns {Object} 匹配的JSON对象
 */
exports.jsonQuery = function (jsonArray, conditions) {
    var i = 0,
        len = jsonArray.length,
        json,
        condition,
        flag;
    for (; i < len; i++) {
        flag = true;
        json = jsonArray[i];
        for (condition in conditions) {
            if (json[condition] !== conditions[condition]) {
                flag = false;
                break;
            }
        }
        if (flag) {
            return json;
        }
    }
};

/**
 * 读取配置文件
 * @param filePath 文件路径
 * @param [key] 要读取的配置项key
 * @param callback 回调函数
 */
exports.getConfig = function (filePath, key, callback) {
    if(typeof key === 'function'){
        callback = key;
        key = undefined;
    }
    fs.readFile(filePath, 'utf8', function (err, file) {
        if (err) {
            console.log('读取文件%s出错：' + err, filePath);
            return callback(err);
        }
        var data = JSON.parse(file);
        if (typeof key === 'string') {
            data = data[key];
        }
        return callback(null, data);
    });
};

//promise读取文件
exports.getConfigAsync = function (filePath,key) {
//	var promise=new Promise();		//报错， Promise()里要传入一个函数
	return new Promise(function(resolve,reject){
		 fs.readFile(filePath, 'utf8', function (err, file) {
	        if (err) {
	           console.log('读取文件%s出错：' + err, filePath);
	           reject(err);
	        }
	        var data = JSON.parse(file);
	        if (typeof key === 'string') {
	            data = data[key];
	        }
	        resolve(data);
	    });
	})
};


/**
 * 写入配置文件
 * @param filePath 文件路径
 * @param setters 要写入的对象
 */
exports.setConfig = function (filePath, setters) {
    fs.readFile(filePath, 'utf8', function (err, file) {
        var data = JSON.parse(file),
            key;
        for (key in setters) {
            data[key] = setters[key];
        }
        var newFile = JSON.stringify(data, null, 2);
        fs.writeFile(filePath, newFile, 'utf8');
    });
};

/**
 * 根据对象的属性和值拼装key
 * @param [prefix] key前缀
 * @param obj 待解析对象
 * @returns {string} 拼装的key，带前缀的形如：prefix_name_Tom_age_20，不带前缀的形如：name_Tom_age_20
 */
exports.generateKey = function (prefix, obj) {
    if (typeof prefix === 'object') {
        obj = prefix;
        prefix = undefined;
    }
    var attr,
        value,
        key = '';
    for (attr in obj) {
        value = obj[attr];
        //形如： _name_Tom
        key += '_' + attr.toString().toLowerCase() + '_' + value.toString()
    }
    if (prefix) {
        //形如：prefix_name_Tom_age_20
        key = prefix + key;
    } else {
        //形如：name_Tom_age_20
        key = key.substr(1);
    }
    return key;
};

/*checkUrl  检查网址是否合法
 * @param URL 网站
 * @return boolean
 */
exports.checkUrl=function(URL){
	var str = URL;
	//下面的代码中应用了转义字符"\"输出一个字符"/"
	var Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
	var objExp = new RegExp(Expression);
	if(objExp.test(str) == true) {
		return true;
	} else {
		return false;
	}
}
/*
 * contain 检查一个值是否位于数组中
 * @param arr  数组
 * @param val  值
 */
exports.contain=function(arr,val){
	var i = arr.length;  
    while (i--) {  
        if (arr[i] === val) {  
            return true;  
        }  
    }  
    return false;  
}
/*
 * isRepeat 检查数组中是否有重复值
 * @param arr  数组
 */
exports.isRepeat = function(arr){
	var hash = {};
    for(var i in arr) {
        if(hash[arr[i]])
        {
            return true;
        }
        hash[arr[i]] = true;
    }
    return false;
}

/*
 * hasSameValue 检查两个数组中是否有相同值
 * @param arr1  数组1
 * @param arr2  数组2
 * @returns Bollean  
 */
exports.hasSameValue=function(arr1,arr2){
	var rs =false;
	for (var i=0; i<arr1.length; i++){
        for (var j=0;j<arr2.length;j++){
            if( arr1[i]== arr2[j]){
                rs=true;
                break;
            }
        }
    }
    return rs;
}

/*
 * checkUploadImg 检查上传图片格式
 * @param type  图片格式
 */
exports.checkUploadImg=function(type){
	let imgArr=CONFIG.UploadImgType;
	if(imgArr.indexOf(type)==-1){
		return false;
	}
	return true;
	
//	return new Promise(function(resolve,reject){
//		if(imgArr.indexOf(type)>-1){
//			resolve(type)
//		}else{
//			reject('该类型暂不支持上传');
//		}
//	})
}

exports.getClientIP = function(req){
    var ipAddress;
    var headers = req.headers;
    var forwardedIpsStr = headers['x-real-ip'] || headers['x-forwarded-for'];
    forwardedIpsStr ? ipAddress = forwardedIpsStr : ipAddress = null;
    if (!ipAddress) {
        ipAddress = req.connection.remoteAddress;
    }
    return ipAddress;
}









