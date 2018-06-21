/*
 * 分类控制器
 */
"use strict";
//数据模型
import {CategoryModel,ArticleModel} from '../../models/'
import validator from 'validator'
const tool = require('../../utility/tool');

export default class CategoryObj{
	constructor(){
		
	}
	async getList(req,res,next){
		let {type='',name} = req.query;
		let data;
		try{
			if(type==='group'){		//根据已有文章进行分组统计		
				data = await CategoryModel.getToGroup();
			}else if(name&&name.length){	//根据名称搜索
				data = await CategoryModel.findOne({name:name}).select('-__v -articles');
			}else{
				data = await CategoryModel.find().select('-__v -articles');
			}
			res.retSuccess({
				data
			});	
		}catch(err){
			console.log('获取分类列表出错:' + err);
			return 	next(err);
		}
	}
	
	async findOneById(req,res,next){
		const id = req.params['id'];
		if (!validator.isMongoId(id)) {
			return res.retErrorParams('分类ID参数错误')
		}
		try{
			let category = await CategoryModel.findById(id,{'__v':0});
			res.retSuccess({
				data:category
			})
		}catch(err){
			console.log('获取分类出错:' + err);
			return 	next(err);
		}
		
	}
	async create(req,res,next){
		let name = req.body.name;
	    let nameArr = name.split('/');
	    let errorMsg = '';
    	if(!name || !name.length){
			errorMsg = '请检查输入';
		}else if(tool.isRepeat(nameArr)){
    	 	errorMsg = '请检查输入不要有相同值';
    	}
    	nameArr.forEach(item =>{
    		if(!item.replace(/(^\s*)|(\s*$)/g,"").length){		//空的字符
    			errorMsg = '请检查输入格式是否正确,不要输入空的字符';
    		}
    	});
    	
    	if(errorMsg.length){
    		return res.retErrorParams(errorMsg)
    	}

	   	try{
	   		let categories = await CategoryModel.find({});
			let allNames = categories.map(item =>{
				return item.name;
			});
			if(tool.hasSameValue(allNames,nameArr)){
				return res.retErrorParams('请不要输入重复的分类')
			}

			let Pro = nameArr.map((name)=>{
				return new Promise(function(resolve, reject){
					try{
						CategoryModel.create({name:name}).then(function(){
							resolve('ok');
						})
					}catch(err){
						reject(err)
					}
				})
			})
			await Promise.all(Pro);
			// nameArr.map(async name =>{
			// 	await CategoryModel.create({
			// 		name:name
			// 	});
			// });
			res.retSuccess();
	   	}catch(err){
	   		console.log('分类添加失败',+err);
	   		return 	next(err);
	   	}
	   	
	
	}
	
	async update(req,res,next){
		const id = req.params['id'];
		let name = req.body.name;
		try{
			if (validator.isEmpty(name.trim())) {
				throw new Error('名称不得为空')
			}else if(!validator.isMongoId(id)){
				throw new Error('分类Id参数错误')
			}
		}catch(err){
			console.log(err.message);
			return res.retErrorParams(err.message)
		}
		try{
			let cate = await CategoryModel.findOne({name: name})
			if(cate){
				return res.retError('已有此名字的分类')
			}
			await CategoryModel.update({_id: id}, {name: name})
			res.retSuccess();
		}catch(err){
			return next(err);
		}
	}
	
	async remove(req,res,next){
		let ids = req.params['id'].split(',');
		try{
			await CategoryModel.remove({_id: { "$in": ids }});
			res.retSuccess();
		}catch(err){
			console.log('分类删除失败'+err);
			return 	next(err);
		}
	}
	
	
}




