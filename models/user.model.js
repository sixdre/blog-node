"use strict";
import mongoose from 'mongoose'
const	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

//用户
const UserSchema = new Schema({
	username: { //用户名唯一
		type: String,
		required: true,
		unique: true
	},
	email: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	isAdmin: { type: Boolean, default: false },
	create_time: { type: Date,default:Date.now()} //创建时间
})

//查找所有
UserSchema.statics.findAll = function() {
	return this.find({ isAdmin: false })
		.sort({ 'create_time': -1 })
		.exec();
}

//根据用户名进行查找
UserSchema.statics.findByName = function(name) {
	return this.find({username: { $regex: '' + name + '' } })
		.sort({'create_time': -1 })
		.exec();
}


UserSchema.index({username:1});

const User = mongoose.model('User', UserSchema);

export default User