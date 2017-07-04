'use strict';
import mongoose from 'mongoose'
const  Schema = mongoose.Schema,
	ObjectId = Schema.Types.ObjectId;
	
const CommentSchema = new Schema({
	articleId: { type: ObjectId, ref: 'Article' },
	from: { type: ObjectId, ref: 'User' }, //谁评论
	reply: [{
		from: { type: ObjectId, ref: 'User' },
		to: { type: ObjectId, ref: 'User' },
		content: String,
		likes: [{
			type: ObjectId,
			ref: 'User'
		}],
		create_time: {
			type: Date,
			default:Date.now()
		},
	}],
	content: String,
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
	next();
});

//静态方法
CommentSchema.statics = {
	findAll: function(cb) {
		return this
			.find({})
			.sort('create_time')
			.exec(cb)
	},
	findBySort: function(aId, orderBy) { //aId 文章id,orderBy 排序方式
		return this.find({ articleId: aId })
			.populate('from')
			.populate('reply.from reply.to')
			.sort(orderBy).exec();
	}
	//	pointLikes:function(cId,Rid){		//cId 评论id，Rid评论回复id
	//		return this.
	//	}

}

CommentSchema.index({ articleId: 1});

const Comment = mongoose.model('Comment', CommentSchema);

export default Comment