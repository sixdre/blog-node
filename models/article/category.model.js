'use strict';
import mongoose from 'mongoose'
import ArticleModel from './article.model';
import categoryData from '../../InitData/category'

const Schema = mongoose.Schema,
	ObjectId = Schema.Types.ObjectId;

const CategorySchema = new Schema({
	name: {
		unique: true,
		type: String
	},
	desc:{		//描述
		type: String,
		default:'暂无描述'
	},
	create_time: {
		type: Date,
		default:Date.now()
	},
	update_time: {
		type: Date,
		default:Date.now()
	},
});

CategorySchema.pre('save', function(next) {
	if(this.isNew) {
		this.create_time = this.update_time = Date.now();
	} else {
		this.update_time = Date.now();
	}
	next()
});



//获取分组
CategorySchema.statics.getToGroup = function(){
	var ctx = this;
	return new Promise(async function (resolve,reject){
		try{
			let group = await ArticleModel.aggregate([{ $match:{"status":2,"is_private":false}},
							{ $group:{ _id: "$category",count:{ $sum: 1 } }}]);
			let Pro = group.map(function(item){
				return new Promise(function(resolve, reject){
					ctx.findById(item._id).then(function(rs){
						if(rs){
							item.name = rs.name;
							item.desc = rs.desc;
						}else{
							item.name = '未分类';
							item.desc = '暂无描述';
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




CategorySchema.index({ name: 1});

const Category = mongoose.model('Category', CategorySchema);

Category.findOne((err, data) => {
	if (!data) {
		for (let i = 0; i < categoryData.length; i++) {
			Category.create(categoryData[i]);
		}
	}
})


export default Category