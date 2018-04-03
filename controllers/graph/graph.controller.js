/*
 * 统计控制器
 */
"use strict";
import moment from 'moment'
//数据模型
import {ArticleModel,CategoryModel,CommentModel,TagModel,UserModel} from '../../models/'

export default class Chart{

	async graph(req,res,next){
		let results = {}
		let bday = moment().subtract(4, 'days').format('YYYY-MM-DD')	 //昨天
		let nowday = moment().format('YYYY-MM-DD')				//今天
		results.cateGroup = await CategoryModel.getToGroup();
		results.tagGroup = await TagModel.getToGroup();
		results.ytArt = await ArticleModel.find({'create_time':{$gte:bday,$lte:nowday}}).count(); //获取昨日发表文章数量

		res.json({
			code:1,
			data:results
		})
	}
	
	
}


