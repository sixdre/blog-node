/*
 * 标签控制器
 */
"use strict";
//数据模型
import {TagModel,ArticleModel} from '../../models/'
import validator from 'validator'
const tool = require('../../utility/tool');

export default class TagObj{
	constructor(){
		
	}
	
	async getList(req,res,next){
		let {type='',name} = req.query;
		let data;
		try{
			if(type==='group'){		//根据已有文章进行分组统计
				data = await TagModel.getToGroup();
			
			}else if(name&&name.length){	//根据名称搜索
				data = await TagModel.findOne({name:name},{'__v':0});
				
			}else{
				data = await TagModel.find({},{'__v':0});
			}
			res.retSuccess({
				data
			});	
		}catch(err){
			console.log('获取标签列表出错:' + err);
			return next(err);
		}
		
	}
	
	async findOneById(req,res,next){
		const id = req.params['id'];
		if (!validator.isMongoId(id)) {
			return res.retErrorParams('标签ID参数错误')
		}
		try{
			let tag = await TagModel.findById(id,{'__v':0});
			res.retSuccess({
				data:tag,
			})
		}catch(err){
			console.log('获取标签出错:' + err);
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
	   		let tags = await TagModel.find({});
			let allNames = tags.map(item =>{
				return item.name;
			});
			if(tool.hasSameValue(allNames,nameArr)){
				return res.retErrorParams('请不要输入重复的标签')
			}

			let Pro = nameArr.map((name)=>{
				return new Promise(function(resolve, reject){
					try{
						TagModel.create({name:name}).then(function(){
							resolve('ok');
						})
					}catch(err){
						reject(err)
					}
				})
			})
			
			await Promise.all(Pro);

			// nameArr.map(async name =>{
			// 	await TagModel.create({
			// 		name:name
			// 	});
			// })
			res.retSuccess();
	   	}catch(err){
	   		console.log('添加标签出错:' + err);
			return next(err);
	   	}
		

	}
	async update(req,res,next){
		const id = req.params['id'];
		let name = req.body.name;
		try{
			if (validator.isEmpty(name.trim())) {
				throw new Error('名称不得为空')
			}else if(!validator.isMongoId(id)){
				throw new Error('标签Id参数错误')
			}
		}catch(err){
			console.log(err.message);
			res.retErrorParams(err.message)
			return
		}
		try{
			let tag=await TagModel.findOne({name: name})
			if(tag){
				return res.retError('已有此名字的标签'); 
			}
			await TagModel.update({_id: id}, {name: name})
			res.retSuccess();
		}catch(err){
			return next(err);
		}
	}
	
	async remove(req,res,next){
		let ids = req.params['id'].split(',');
		console.log(ids)
		try{
			await TagModel.remove({_id: { "$in": ids }});
			let Pro = ids.map((item)=>{			//同时将文章中包含改标签给更新掉
				return ArticleModel.update({tags:{ "$in": [item] }},{'$pull':{'tags':item}},{multi:true})
			})
			await Promise.all(Pro);
			res.retSuccess();
		}catch(err){
			console.log('删除标签出错:' + err);
			return next(err);
		}
	}
	
}


