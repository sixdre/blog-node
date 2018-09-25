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
		let allPv = await ArticleModel.aggregate([{$group:{_id:null,total: { $sum: "$pv_num" }}}])
		
		results.allPv = allPv[0].total;				//网站文章总访问数量
		results.cateGroup = await CategoryModel.getToGroup();
		results.tagGroup = await TagModel.getToGroup();
		results.ytArt = await ArticleModel.find({'create_time':{$gte:bday,$lte:nowday}}).count(); //获取昨日发表文章数量
		
		results.userCount = await UserModel.count(); //用户总数
		results.commentCount = await CommentModel.count(); //评论总数
		results.articleCount = await ArticleModel.count(); //文章总数
		
		
		res.json({
			code:1,
			data:results
		})
	}
	
	
}


