'use strict';
const mongoose = require('mongoose')  
    , Schema = mongoose.Schema  
    , ObjectId = Schema.ObjectId;
    
const BannerSchema=new Schema({ 
	dec:{
        type:String,
        required:true 		//轮播图描述
    },
    url:{
    	type:String,
        default:'#' 		//轮播图链接地址
    },
    weight:{				//权重默认为0，越高排名越前
    	type:Number,
    	default:0
    },
    imgAdress:{					//图片地址
    	type:String,
        required:true 			
    },
    create_time:{				//时间
    	type:Date,
    	default:Date.now()
    }
})

mongoose.model("Banner",BannerSchema);

