'use strict';
import mongoose from 'mongoose'
import autoIncrement from 'mongoose-auto-increment' //自增ID 模块	
import validator from 'validator'

const Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

autoIncrement.initialize(mongoose.connection);

//文章
const ArticleSchema = new Schema({
	author: { 			//作者
		type: String
	},
	title: {			//标题
		unique: true,
		index: true,
		type: String
	}, 		
	category: { 		//类型分类
		type: ObjectId,
		ref: 'Category'
	},
	tags: [{ 			//标签
		type: ObjectId,
		ref: 'Tag'
	}],
	content: String, 	//内容
	tagcontent: String, //带格式的内容
	abstract:String,	//简介
	img: String, 		//封面
	source: { 	  		//文章来源(出处)
		type: String
	},
	likes: [{ 			//点赞用户
		type: ObjectId,
		ref: 'User'
	}], 
	nums:{
		cmtNum:{ 		//评论数
			type: Number,
			default: 0
		},
		likeNum:{		//点赞数
			type: Number,
			default: 0
		},
		pv: {			//浏览量
			type: Number,
			default: 0
		}
	},
	is_private: {		 	//是否为私有
		type: Boolean,
		default: false
	},
	allow_comment:{			//允许评论
		type: Boolean,
		default: true
	},
	top: {		 		// 置顶文章
		type: Boolean,
		default: false
	},
	good: {				// 精华文章
		type: Boolean,
		default: false
	}, 
	status:{
		type: Number,
		default:2      //0 表示删除，1表示草稿，2 表示有效
	},
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



//根据条件查询
ArticleSchema.statics.findList = function({page = 1,limit = 10,flag = 2,title = ''}){
	return new Promise(async (resolve,reject)=>{
        page = parseInt(page);
        limit = parseInt(limit);
        flag = parseInt(flag);
        let queryObj = {
        	is_private:false,
            title: {
                '$regex': title
            },
            status:flag
        }
        if(flag == 3){		//查询全部
            delete queryObj.status;
        }
        
        try {
            const total = await this.model('Article').count(queryObj);
            const totalPage =Math.ceil(total/limit);

            if(!total||page>totalPage) {
                resolve({
                    code: -1,
                    page,
                    total,
                    articles:[]
                });
                return;
            }
            const articles = await this.model('Article').find(queryObj,{content:0,tagcontent:0,__v:0})
                .sort({ "create_time": -1 }).skip(limit * (page-1))
                .limit(limit).populate('category','name').populate('tags','name');
          
            resolve({
                articles,
                total,			//文章总数
                totalPage,		//总计页数
                page	        //当前页
            });
        } catch(err) {
            reject('获取文章列表出错:' + err);
        }
    })
}



//查找上一篇
ArticleSchema.statics.findPrev = function(bid, callback) {
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



ArticleSchema.plugin(autoIncrement.plugin, {
	model: 'Article', //数据模块
	field: 'bId', 	  //字段名
	startAt: 1,       //开始位置，自定义
	incrementBy: 1    //每次自增数量
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





