'use strict';
import mongoose from 'mongoose'
const  Schema = mongoose.Schema  
    , ObjectId = Schema.ObjectId;
    
const WordSchema=new Schema({
	user:{					//留言用户
		type: ObjectId,
		ref: 'User'
	},
	message:{				//留言内容
		type:String
	},
	reply:{
		user:{
			type: ObjectId,
			ref: 'User'
		},
		content:{
			type:String
		},
		replyTime:{
			type:Date,
			default:Date.now()
		}
	},
	state:{
		isRead:{
			type:Boolean,
			default:false			//false表示未读  true表示已读
		},
		isReply:{
			type:Boolean,
			default:false			//false表示未回复  true表示已回复
		}
	},
	meta:{
		create_time:{					//用户留言时间
			type:Date,
			default:Date.now()
		}
	}

});

//查询所有未回复的留言
WordSchema.statics.findAllNotReply=function(){
	return this.find({'state.isReply':false}).exec();
}

//查询所有已回复的留言
WordSchema.statics.findAllReply=function(){
	return this.find({'state.isReply':true}).exec();
}


const Word = mongoose.model("Word",WordSchema);

export default Word


