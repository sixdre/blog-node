"use strict";
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import validator from 'validator'
import Identicon from 'identicon.js'
import userData from '../../InitData/user'

const	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

const SALT_WORK_FACTOR = 5;



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
	avatar:String,			
	follows:[{				//关注的用户
		type:Schema.Types.ObjectId,
		ref:'User'
	}],
	collectArts:[{		//收藏的文章
		type:Schema.Types.ObjectId,
		ref:'Article'
	}],
	likeArts: [{ 		//点赞文章
		type:Schema.Types.ObjectId,
		ref: 'Article'
	}], 
	role:{				//角色
		type:Schema.Types.ObjectId,
		ref:'Role'
	},
	isAdmin: { type: Boolean, default: false },
	create_time: { type: Date,default:Date.now()} //注册时间
})

UserSchema.set('toJSON',{
	virtuals: true
})
/*
 * 字段验证
 */
UserSchema.path('email').validate(function(value){
	return validator.isEmail(value);
},'不是正确的邮箱地址')

UserSchema.path('password').validate(function(value){
	return validator.isLength(value,{min:3})
},'密码不得小于3位！')


UserSchema.virtual('role_id')
  .get(function() {
  	let roleId = this.role?this.role.id:'';
    return roleId;
});
UserSchema.virtual('role_name')
  .get(function() {
  	let roleName = this.role?this.role.name:'';
    return roleName;
});


UserSchema.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password')) return next();
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);
            bcrypt.hash(user.username, salt,function(err,uh){
            	let imgData = new Identicon(uh,100).toString()
            	let avatar = 'data:image/png;base64,'+imgData // 生成hash头像
            	user.avatar = avatar;
            	user.password = hash;
            	next();
            })
        });
    });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};


//列表分页
UserSchema.statics.getListToPage = function({query={},page=1,limit=20,select}){
	// queryobj={},page=1,limit=20){
	page = parseInt(page);
	limit = parseInt(limit);
	if(!select){
		select = 'username email avatar create_time'
	}
	return new Promise(async (resolve,reject)=>{
		try{
			let total =  await this.count(query);
			let data = await this.find(query).select(select)
							.skip(limit * (page-1)).limit(limit);
			resolve({
				data,
				total,
				limit,
				page
			})
		}catch(err){
			reject(err);
		}
	})
}


UserSchema.index({username:1});

const User = mongoose.model('User', UserSchema);

User.findOne((err, data) => {
	if (!data) {
		for (let i = 0; i < userData.length; i++) {
			new User(userData[i]).save();
		}
	}
})



export default User