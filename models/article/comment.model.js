'use strict';
import mongoose from 'mongoose'
import ArticleModel from './article.model';

const  Schema = mongoose.Schema,
	ObjectId = Schema.Types.ObjectId;
	
const CommentSchema = new Schema({
	articleId: { type: ObjectId, ref: 'Article',required:true},
	from: { type: ObjectId, ref: 'User' }, //谁评论
	to:{ type: ObjectId, ref: 'User' }, //回复谁
	reply: [{
		type: ObjectId, ref: 'Comment'
	}],
	content:{
		type:String,
		required:true 
	},
	likes: [{
		type: ObjectId,
		ref: 'User'
	}],
	isM:{				//是否同时发表为主评论(一般作为回复时进行判断)
		type: Boolean,
		default: true
	},
	create_time: {
		type: Date,
		default:Date.now()
	},
},{
	toJSON: {virtuals: true},
	toObject: {virtuals: true},
});


CommentSchema.virtual('like_num')
  .get(function() {
    return this.likes.length
  });

//中间件
CommentSchema.pre('save', function(next) {
	if(this.isNew) {
		this.create_time = Date.now();
	} 
	ArticleModel.update({_id:this.articleId},{'$inc':{'cmt_num':1}}).then(function(){
		next();
	},function(err){
		next(err);
	})
});


/*添加回复
@param id 			评论id
@param articleId 	文章id
@param reply 		回复评论id
*/
CommentSchema.statics.reply = function(id,articleId,reply){
	return this.update({ _id: id }, { $addToSet: { "reply": reply } });
}



//列表分页
CommentSchema.statics.getListToPage = function(queryobj,page=1,limit=10,order_by){
	page = parseInt(page);
	limit = parseInt(limit);
	let baseQuery = {
		'isM':true
	}
	let params = Object.assign(baseQuery, queryobj);
	return new Promise(async (resolve,reject)=>{
		try{
			let total =  await this.count(params);
			let data = await this.find(params,{'__v':0})
			.populate({
					path:'from likes reply',
					select: 'articleId username content avatar',
					populate: {
				        path: 'from to likes',
				        select: 'username content avatar',
				    }
				}).skip(limit * (page-1)).limit(limit).sort(order_by);
			resolve({
				data,
				total,
				limit,
				page
			})
		}catch(err){
			reject(err);
		}
	})
}




CommentSchema.index({ articleId: 1});

const Comment = mongoose.model('Comment', CommentSchema);

export default Comment