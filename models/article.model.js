'use strict';
import mongoose from 'mongoose'
import autoIncrement from 'mongoose-auto-increment' //自增ID 模块	
import validator from 'validator'

const Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

autoIncrement.initialize(mongoose.connection);

const BaseQuery = require('../models/dbHelper'),
	aQuery = BaseQuery.ArticlesQuery;

//文章
const ArticleSchema = new Schema({
	author: { 	//作者
		type: String
	},
	title: String, //标题
	category: { 	//类型分类
		type: ObjectId,
		ref: 'Category'
	},
	tags: [{ 	//标签
		type: ObjectId,
		ref: 'Tag'
	}],
	content: String, 	//内容
	tagcontent: String, //带格式的内容
	img: String, 		//封面
	source: { 	  		//文章来源(出处)
		type: String
	},
	likes: [{ 	//点赞用户
		type: ObjectId,
		ref: 'User'
	}], 
	nums:{
		cmtNum:{ //评论数
			type: Number,
			default: 0
		},
		likeNum:{	//点赞数
			type: Number,
			default: 0
		},
		pv: {		//浏览量
			type: Number,
			default: 0
		}
	},
	likeNum:{		//点赞数
		type: Number,
		default: 0
	},
	pv: {		//浏览量
		type: Number,
		default: 0
	}, 
	top: {		 // 置顶文章
		type: Boolean,
		default: false
	},
	good: {		// 精华文章
		type: Boolean,
		default: false
	}, 
	isDeleted:{		//软删除用于删除找回
		type: Boolean,
		default: false
	},
	isDraft: {		//是否草稿
		type: Boolean,
		default: false
	}, 
//	isActive: {		 //是否有效
//		type: Boolean,
//		default: true
//	},
	create_time: {		//创建时间
		type: Date,
		default:Date.now()
	},
	update_time: {		//更新时间或修改时间
		type: Date,
		default:Date.now()
	}
})



/*
 * 字段验证
 */
ArticleSchema.path('source').validate(function(value){
	if(!value||validator.isURL(value)){
		return true
	}
	return false;
},'文章来源字段不合法')



//查找所有
ArticleSchema.statics.findAll = function(callback) {
	let query = aQuery();

	return this.model('Article')
		.find(query)
		.sort({
			create_time: -1
		})
		.exec(function(error, doc) {
			if(error) {
				console.log(error);
				callback([]);
			} else {
				callback(doc);
			}
		});
}

//查找最新的
ArticleSchema.statics.findNew = function(limit, callback) {
	let query = aQuery();
	return this.model('Article')
		.find(query)
		.sort({
			create_time: -1
		})
		.limit(limit)
		.exec(function(error, doc) {
			if(error) {
				console.log(error);
				callback([]);
			} else {
				callback(doc);
			}
		});
}
//查找上一篇
ArticleSchema.statics.findPrev = function(bid, callback) {
	let query = aQuery();
	query.bId = {
		'$lt': bid
	}
	return this.model('Article')
		.findOne(query).sort({
			bId: -1
		}).limit(1)
		.exec(function(error, doc) {
			if(error) {
				console.log(error);
				callback([]);
			} else {
				callback(doc);
			}
		});
}

//查找下一篇
ArticleSchema.statics.findNext = function(bid, callback) {
	let query = aQuery();
	query.bId = {
		'$gt': bid
	}
	return this.model('Article')
		.findOne(query).sort({
			bId: 1
		}).limit(1) //此处.sort({bId: -1}).limit(1) 可省
		.exec(function(error, doc) {
			if(error) {
				console.log(error);
				callback([]);
			} else {
				callback(doc);
			}
		});
}

//通过自增bId来查找
ArticleSchema.statics.findByBId = function(id, callback) {
	return this.model('Article').findOne({
		bId: id
	}, function(error, doc) {
		if(error) {
			console.log(error);
			callback(null);
		} else {
			callback(doc);
		}
	});

}

//根据时间来查找
ArticleSchema.statics.findByTime = function(time, callback) {
	return this.model('Article')
		.find({
			create_time: time
		})
		.exec(function(error, doc) {
			if(error) {
				console.log(error);
				callback([]);
			} else {
				callback(doc);
			}
		});
}

//查询热门文章 (根据浏览数来排序)--客户端
ArticleSchema.statics.findByHot = function(limit, callback) {
	let query = aQuery();
	return this.model('Article')
		.find(query)
		.sort({
			'nums.pv': -1
		})
		.limit(limit)
		.exec(function(error, hot) {
			if(error) {
				console.log(error);
				callback([]);
			} else {
				callback(hot);
			}
		});
}

//根据文章标题进行查找
ArticleSchema.statics.findByTitle = function(title, callback) {
	return this.model('Article')
		.find({
			title: {
				$regex: '' + title + ''
			}
		})
		.sort({
			create_time: -1
		})
		.exec(function(error, doc) {
			if(error) {
				console.log(error);
				callback([]);
			} else {
				callback(doc);
			}
		});
}
//根据文章文章id进行更新阅读浏览数
ArticleSchema.statics.findBybIdUpdate = function(id, callback) {
	return this.model('Article')
		.update({
			bId: id
		}, {
			'$inc': {
				'nums.pv': 1
			}
		})
		.exec(function(error) {
			if(error) {
				console.log(error);
			} else {
				callback();
			}
		});
}


ArticleSchema.plugin(autoIncrement.plugin, {
	model: 'Article', //数据模块，需要跟同名 x.model("Books", BooksSchema);
	field: 'bId', 	   //字段名
	startAt: 1,      //开始位置，自定义
	incrementBy: 1   //每次自增数量
});
ArticleSchema.pre('save', function(next) {
	this.nums.likeNum=this.likes.length;
	if(this.isNew) {
		this.create_time = this.update_time = Date.now()
	} else {
		this.update_time = Date.now()
	}
	next();
});

const Article = mongoose.model('Article', ArticleSchema);

export default Article





