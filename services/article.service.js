import validator from 'validator'
import { ArticleModel, CategoryModel, CommentModel, TagModel, UserModel } from '../models/'

export class articleService {
    /*
    * 根据ID 获取文章信息
    * @param {string} id 查询ID
    * @return {Promise[Article]}
    */
    getById(id){
        return ArticleModel.findOne({'_id':id}, { __v: 0 })
            .populate('author', 'username avatar')
            .populate('category', 'name')
            .populate('tags', 'name')
    }
    /*
    * 获取列表
    * @param {Object} queryobj 查询对象
    * @return {Promise[]} 列表的 Promise 对象
    */
    getList(queryobj) {
        return ArticleModel.find(queryobj, { content: 0, __v: 0 })
            .populate('author', 'username avatar')
            .populate('category', 'name')
            .populate('tags', 'name')
    }
    /*
    * 分页获取列表
    * @param {Object} queryobj 查询对象
    * @param {Number} page 当前页数
    * @param {Number}} pageSize 每页显示数量
    * @return {Promise[]} 列表的 Promise 对象
    */
    async getListToPage(queryobj, page = 1, pageSize = 10) {
        let { ids, title = "", status, tagId, categoryId, author, type, startTime, endTime } = queryobj;
        let baseQuery = {
            'is_private': false, //非私有文章
            'status': 2, //有效的文章

        }
        let queryParams = {
            // top: false,
            // ...queryobj,
            title: {
                '$regex': title
            },
            status: status ? parseInt(status) : 2,
            is_private: false
        }
        if (ids && Array.isArray(ids)) {
            queryParams._id = { "$in": ids }
        }
        if (type === "good") {
            queryParams.good = true;
        }
        if (categoryId && validator.isMongoId(categoryId)) {
            queryParams.category = categoryId;
        }
        if (tagId && validator.isMongoId(tagId)) {
            queryParams.tags = { '$in': [tagId] }
        }
        if (startTime && !endTime) {
            startTime = new Date(startTime)
            queryParams['create_time'] = { $gte: startTime }
        } else if (!startTime && endTime) {
            endTime = new Date(endTime)
            queryParams['create_time'] = { $lte: endTime }
        } else if (startTime && endTime) {
            startTime = new Date(startTime)
            endTime = new Date(endTime)
            queryParams['create_time'] = { $gte: startTime, $lte: endTime }
        }

        if (queryParams.status == 3) { //查询全部
            delete queryParams.status;
            delete baseQuery.status;
        }
        if (queryParams.is_private === null) { //查询全部
            delete queryParams.is_private;
            delete baseQuery.is_private;
        }
        page = parseInt(page);
        pageSize = parseInt(pageSize);
        return new Promise(async(resolve, reject) => {
            try {
                let total = await ArticleModel.count(baseQuery);
                let data = await this.getList(queryParams)
                    .skip(pageSize * (page - 1)).limit(pageSize)
                    .sort({ top: -1, "create_time": -1, });

                resolve({
                    data,
                    total,
                    pageSize,
                    page
                })
            } catch (err) {
                reject(err);
            }
        })
    }

}

export default new articleService()