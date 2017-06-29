"use strict";

/** ArticlesQuery  为文章查询构建初始条件
 * @param params  查询参数对象
 * @returns 返回查询对象 
 */  
exports.ArticlesQuery=function(params){
	let query = {};
	query.isDeleted = false;		//有效
//  query.isActive = true;		//有效
    query.isDraft = false;		//不是草稿的
    return query;
}