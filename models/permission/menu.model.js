'use strict';
import mongoose from 'mongoose'
import fs from 'fs'
const  Schema = mongoose.Schema  
    , ObjectId = Schema.ObjectId;

var menus = JSON.parse(fs.readFileSync('./InitData/menu.json').toString()).data;

//菜单表
const menuSchema=new Schema({
	pid:{
		type:String,
		required:true,
		default:'0' 
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
	sort:{
		type:Number,
		default:1
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

Menu.findOne((err, data) => {
	if (!data) {
		menus.map( async item =>{
			console.log(item)
			await Menu.create(item);
		});
	}
})

export default Menu


