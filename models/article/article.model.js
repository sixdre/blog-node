'use strict';
import mongoose from 'mongoose'
import validator from 'validator'
import moment from 'moment'

const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


//文章
const ArticleSchema = new Schema({
    author: { //作者
        type: ObjectId,
        ref: 'User',
        required: true
    },
    title: { //标题
        // unique: true,
        // index: true,
        type: String,
        // required: true 
    },
    category: { //类型分类
        type: ObjectId,
        ref: 'Category',
        // required: true 
    },
    tags: [{ //标签
        type: ObjectId,
        ref: 'Tag'
    }],
    content: String, //内容
    abstract: String, //简介
    img: String, //封面
    source: String, //文章来源(出处)
    cmt_num: { //评论数	
        type: Number,
        default: 0
    },
    collect_num: { //收藏数
        type: Number,
        default: 0
    },
    like_num: { //点赞数
        type: Number,
        default: 0
    },
    pv_num: { //浏览量
        type: Number,
        default: 0
    },
    is_private: { //是否为私有
        type: Boolean,
        default: false
    },
    allow_comment: { //允许评论
        type: Boolean,
        default: true
    },
    top: { // 置顶文章
        type: Number,
        default: 0
    },
    good: { // 精华文章
        type: Boolean,
        default: false
    },
    status: {
        type: Number,
        default: 2 //0 表示删除，1表示草稿，2 表示有效
    },
    create_time: { //创建时间
        type: Date,
        default: Date.now(),
        get: v => moment(v).format('YYYY-MM-DD HH:mm:ss')
    },
    update_time: { //更新时间或修改时间
        type: Date,
        default: Date.now(),
        get: v => moment(v).format('YYYY-MM-DD HH:mm:ss')
    },
    draft_time: { //定为草稿的时间
        type: Date,
        default: Date.now(),
        get: v => moment(v).format('YYYY-MM-DD HH:mm:ss')
    },
    last_cmt_time: { //最后一次评论时间
        type: Date,
        get: v => moment(v).format('YYYY-MM-DD HH:mm:ss')
    }
}, {
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
})

// schema.path('date').get(function (date) {
//   return date.toEast8();
// });


ArticleSchema.virtual('author_name')
    .get(function() {
        return this.author.username
    });

ArticleSchema.virtual('category_name')
    .get(function() {
        let categoryName = this.category ? this.category.name : '';
        return categoryName;
    });

ArticleSchema.virtual('tag_names')
    .get(function() {
        let tagNames = this.tags.map(item => item.name);
        return tagNames;
    });


/*
 * 字段验证
 */
ArticleSchema.path('source').validate(function(value) {
    if (!value || validator.isURL(value)) {
        return true
    }
    return false;
}, '文章来源字段不合法')


ArticleSchema.pre('save', function(next) {
    if (this.isNew) {
        this.create_time = this.update_time = Date.now()
    } else {
        this.update_time = Date.now()
    }
    if (this.status !== 1) { //如果文章不是草稿需要验证类型 与标题
        if (!this.category) {
            next(new Error('category is required'))
        }
        if (!this.title) {
            next(new Error('title is required'))
        }
    }
    next();
});


    //更新pv
ArticleSchema.statics.updatePv = function(id, pv = 1) {
    return this.update({ _id: id }, { '$inc': { 'pv_num': pv } });
}




const Article = mongoose.model('Article', ArticleSchema);

export default Article