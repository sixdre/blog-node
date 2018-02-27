'use strict';
import mongoose from 'mongoose'
import {ArticleModel} from './index';

const  Schema = mongoose.Schema,
	ObjectId = Schema.Types.ObjectId;
	
const CommentSchema = new Schema({
	articleId: { type: ObjectId, ref: 'Article',required:true},
	from: { type: ObjectId, ref: 'User' }, //谁评论
	reply: [{
		from: { type: ObjectId, ref: 'User' },
		to: { type: ObjectId, ref: 'User' },
		content:{
			type:String,
			required:true 
		},
		likes: [{
			type: ObjectId,
			ref: 'User'
		}],
		create_time: {
			type: Date,
			default:Date.now()
		},
	}],
	content:{
		type:String,
		required:true 
	},
	likes: [{
		type: ObjectId,
		ref: 'User'
	}],
	likeNum: {
		type: Number,
		default: 0
	},
	create_time: {
		type: Date,
		default:Date.now()
	}
});

//中间件
CommentSchema.pre('save', function(next) {
	this.likeNum = this.likes.length;
	if(this.isNew) {
		this.create_time = Date.now();
	} 
	ArticleModel.update({_id:this.articleId},{'$inc':{'nums.cmtNum':1}}).then(function(){
		next();
	},function(err){
		next(err);
	})
});


/*添加回复
@param id 			评论id
@param articleId 	文章id
@param reply 		回复实体
*/
CommentSchema.statics.reply = function(id,articleId,reply){
	return this.update({ _id: id }, { $addToSet: { "reply": reply } }).then(function(){
		return ArticleModel.update({_id:articleId},{'$inc':{'nums.cmtNum':1}})
	})
}



//列表分页
CommentSchema.statics.getListToPage = function(queryobj,page=1,pageSize=10,order_by){
	page = parseInt(page);
	pageSize = parseInt(pageSize);
	return new Promise(async (resolve,reject)=>{
		try{
			let total =  await this.count(queryobj);
			let data = await this.find(queryobj).populate({
					path:'from reply.from reply.to likes reply.likes',
					select:'username'
				}).skip(pageSize * (page-1)).limit(pageSize).sort(order_by);
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













CommentSchema.statics.findAll=function(cb) {
	return this.find({}).sort('create_time').exec(cb)
},

CommentSchema.statics.findBySort=function(aId,orderBy) {
	return this.find({ articleId: aId })
			.populate('from')
			.populate('reply.from reply.to')
			.sort(orderBy).exec();
},


CommentSchema.index({ articleId: 1});

const Comment = mongoose.model('Comment', CommentSchema);

export default Comment