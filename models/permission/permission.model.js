'use strict';
import mongoose from 'mongoose'
const  Schema = mongoose.Schema  
    , ObjectId = Schema.ObjectId;
    
const permissionSchema=new Schema({
	name:{
		type:String,
		required:true 
	},
	resource:{
		type:String
	},
	type:{
		type:String,
		default: 'get'
	},
	tag:{
		type:String,
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


