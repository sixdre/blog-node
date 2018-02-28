'use strict';
import mongoose from 'mongoose'
const  Schema = mongoose.Schema  
    , ObjectId = Schema.ObjectId;
    
const FriendSchema=new Schema({
	title:{
		type:String,
		required:true 
	},
	url:{
		type:String
	},
	sort:{
		type: Number, 
		default: 0
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

FriendSchema.pre("save",function(next){
	if(this.isNew){
		this.meta.create_time=this.meta.update_time=Date.now();
	}else{
		this.meta.update_time=Date.now();
	}
	next();
})

FriendSchema.index({ title: 1});




FriendSchema.statics.getListToPage = function(queryobj={},page=1,pageSize=10){
	page = parseInt(page);
	pageSize = parseInt(pageSize);
	return new Promise(async (resolve,reject)=>{
		try{
			let total =  await this.count(queryobj);
			let data = await this.find(queryobj)
							.skip(pageSize * (page-1)).limit(pageSize)
							.sort({ "sort": -1 });
			resolve({
				data,
				total,
				pageSize
			})
		}catch(err){
			reject(err);
		}
	})
}




















const Friend = mongoose.model("Friend",FriendSchema);


export default Friend


