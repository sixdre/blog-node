'use strict';
import mongoose from 'mongoose'
const  Schema = mongoose.Schema  
    , ObjectId = Schema.ObjectId;
 
//菜单表
const roleSchema=new Schema({
	name:{
		type:String,
		required:true 
	},
	menuIds:[{
		type: ObjectId,
		ref: 'Menu'
	}],
	permissionIds:[{
		type: ObjectId,
		ref: 'Permission'
	}],
	super:{
		type:Boolean,
		required:true,
		default: false
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

roleSchema.pre("save",function(next){
	if(this.isNew){
		this.meta.create_time=this.meta.update_time=Date.now();
	}else{
		this.meta.update_time=Date.now();
	}
	next();
})


const Role = mongoose.model("Role",roleSchema);


export default Role


