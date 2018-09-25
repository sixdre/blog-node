import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import validator from 'validator'
import userData from '../../InitData/user'
const	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;


//用户
const UserSetting = new Schema({
	create_time: { type: Date,default:Date.now()} //注册时间
})


const UserSetting = mongoose.model('UserSetting', UserSetting);




export default UserSetting