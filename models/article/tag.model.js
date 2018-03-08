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
			let group = await ArticleModel.aggregate([
							{ $match:{"status":2,"is_private":false}},
							{ $unwind : "$tags"},
							{ $group:{ _id: "$tags",count:{ $sum: 1 } }}]);

			let Pro = group.map(function(item){
				return new Promise(function(resolve, reject){
					ctx.findById(item._id).then(function(rs){
						if(rs){
							item.name = rs.name;
						}else{
							item.name = '未分类';
						}
						resolve(item);
					},function(err){
						reject(err)
					})
				})
			})			
			let data = await Promise.all(Pro);	
			resolve(data)
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