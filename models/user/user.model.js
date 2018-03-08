"use strict";
import mongoose from 'mongoose'
import userData from '../../InitData/user'
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
	avatar:{
		type: String,
		default:'https://sfault-avatar.b0.upaiyun.com/161/227/1612276764-55f6bdd353b39_big64'
	},
	isAdmin: { type: Boolean, default: false },
	create_time: { type: Date,default:Date.now()} //注册时间
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

User.findOne((err, data) => {
	if (!data) {
		for (let i = 0; i < userData.length; i++) {
			User.create(userData[i]);
		}
	}
})



export default User