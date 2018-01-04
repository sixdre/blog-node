'use strict';
import mongoose from 'mongoose'
const  Schema = mongoose.Schema  
    , ObjectId = Schema.ObjectId;
 
//菜单表
const menuSchema=new Schema({
	pid:{
		type:String,
		required:true 
	},
	path:{
		type:String,
		required:true 
	},
	name:{
		type:String,
		required:true 
	},
	icon:{
		type:String
	},
	hidden:{
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

menuSchema.pre("save",function(next){
	if(this.isNew){
		this.meta.create_time=this.meta.update_time=Date.now();
	}else{
		this.meta.update_time=Date.now();
	}
	next();
})


const Menu = mongoose.model("Menu",menuSchema);


export default Menu


