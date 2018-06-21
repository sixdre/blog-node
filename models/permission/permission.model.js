'use strict';
import mongoose from 'mongoose'
const  Schema = mongoose.Schema  
    , ObjectId = Schema.ObjectId;
    
const permissionSchema=new Schema({
	pid:{					//所属父级
		type:String,
		default:'0' 
	},
	name:{					//权限名称
		type:String,
		required:true 
	},
	code:{					//权限代码
		type:String,
		required:true 
	},
	resource:{				//请求路径
		type:String
	},
	type:{
		type:String,
		default: 'get'
	},
	tag:{
		type:String,
	},
	isPage:{		 	//是否为页面
		type: Boolean,
		default: false
	},
	menuUrl:{		//如果是页面的话需要这个
		type:String
	},
	meta:{
		create_time:{
			type:Date,
			default:Date.now()
		},
		update_time:{ 
			type: Date,
			default:Date.now()
		}
	}
})

permissionSchema.pre("save",function(next){
	if(this.isNew){
		this.meta.create_time=this.meta.update_time=Date.now();
	}else{
		this.meta.update_time=Date.now();
	}
	next();
})


const Permission = mongoose.model("Permission",permissionSchema);


export default Permission


