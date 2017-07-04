'use strict';
import mongoose from 'mongoose'

const Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

const BannerSchema = new Schema({
	dec: {
		type: String,
		required: true //轮播图描述
	},
	url: {
		type: String,
//		set:function(url){
//          if(!url) return url;
//          if(0!==url.indexOf('http://')) url='http://'+url;
//          return url;
//     },
		default: '#' //轮播图链接地址
	},
	weight: { //权重默认为0，越高排名越前
		type: Number,
		default: 0
	},
	imgAdress: { //图片地址
		type: String,
		required: true
	},
	create_time: { //时间
		type: Date,
		default: Date.now()
	}
})

const Banner = mongoose.model("Banner", BannerSchema);

export default Banner