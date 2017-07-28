"use strict";
import _ from 'underscore'
import ArticleModel from '../models/article.model'
import UploadComponent from '../prototype/upload'
class articleService extends UploadComponent {
    constructor(){
        super()
    }

    //获取文章列表（默认获取有效文章）
    get({cp = 1,limit = 10,flag = 2,title = ''}){
        return new Promise(async (resolve,reject)=>{
            cp = parseInt(cp);
            limit = parseInt(limit);
            flag = parseInt(flag);
            let queryObj = {
                title: {
                    '$regex': title
                },
                status:flag
            }
            if(flag == 3){		//查询全部
                delete queryObj.status;
            }
            
            try {
                const total = await ArticleModel.count(queryObj);
                const totalPage =Math.ceil(total/limit);
                if(!total||cp>totalPage) {
                    resolve({
                        code: -1,
                        cp,
                        total,
                        articles:[]
                    });
                    return;
                }
                const articles = await ArticleModel.find(queryObj)
                    .sort({ "create_time": -1 }).skip(limit * (cp-1))
                    .limit(limit).populate('category','name').populate('tags','name');
                
                resolve({
                    code: 1,
                    articles,
                    total,		//文章总数
                    totalPage,	//总计页数
                    cp	//当前页
                });
            } catch(err) {
                reject('获取文章列表出错:' + err);
            }
        })
    }

    //根据ID获取文章
    getById(id){
        return new Promise(async (resolve,reject)=>{
            if(!id){
                reject({
                    type: 'ERROR',
                    message:'ERROR_PARAMS ID'
                });
            }
            try {
                let article = await ArticleModel.findById(id).populate('category','-__v').populate('tags','-__v');
                resolve(article);
            } catch(err) {
                reject(err);
            }
        })
    }

}

export default new articleService();