'use strict';
import mongoose from 'mongoose'
import ArticleModel from './article.model';
import tagData from '../../InitData/tag'

const	Schema = mongoose.Schema,
	ObjectId = Schema.Types.ObjectId;

const TagSchema = new Schema({
	name: {
		unique: true,
		type: String
	},
	create_time: { type: Date,default:Date.now()},
	update_time: { type: Date,default:Date.now()}
});

TagSchema.pre('save', function(next) {
	if(this.isNew) {
		this.create_time = this.update_time = Date.now();
	} else {
		this.update_time = Date.now();
	}
	next()
});


//获取分组
TagSchema.statics.getToGroup = function(){
	var ctx = this;
	return new Promise(async function (resolve,reject){
		try{
			let group = await ArticleModel.aggregate([	//从文章中统计的已有标签
							{ $match:{"status":2,"is_private":false}},
							{ $unwind : "$tags"},
							{ $group:{ _id: "$tags",count:{ $sum: 1 } }}]);
			let allTag = await ctx.find().select('name')			//查询所有的标签			
			let result = allTag.map(function(item){
				let jsonItem = item.toJSON();
				let s = group.find(function(it){
					return String(it._id) === String(jsonItem._id); 
				})
				if(s){
					jsonItem.count = s.count;
				}else{
					jsonItem.count = 0;
				}
				return jsonItem;
			})
			resolve(result)
		}catch(err){
			reject(err);
		}
	})
}




TagSchema.index({ name: 1});

const Tag = mongoose.model('Tag', TagSchema);

Tag.findOne((err, data) => {
	if (!data) {
		for (let i = 0; i < tagData.length; i++) {
			Tag.create(tagData[i]);
		}
	}
})
export default Tag