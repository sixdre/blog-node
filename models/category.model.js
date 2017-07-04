'use strict';
import mongoose from 'mongoose'

const Schema = mongoose.Schema,
	ObjectId = Schema.Types.ObjectId;

const CategorySchema = new Schema({
	name: {
		unique: true,
		type: String,
		default:'未分类'
	},
	articles: [{
		type: ObjectId,
		ref: 'Article'
	}],
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

CategorySchema.index({ name: 1});

const Category = mongoose.model('Category', CategorySchema);

export default Category