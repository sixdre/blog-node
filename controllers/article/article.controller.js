/*
 * 文章控制器（文章发布，查询，删除）
 */
"use strict";
import assert from 'assert'
import _ from 'underscore'
import moment from 'moment'
import validator from 'validator'
import request from 'request'
import MarkdownIt from 'markdown-it'
import { ArticleModel, CategoryModel, CommentModel, TagModel, UserModel } from '../../models/'
import ArticleService from '../../services/article.service'
import UploadComponent from '../../prototype/upload'
const tool = require('../../utility/tool');

export default class ArticleObj extends UploadComponent {
    constructor() {
        super()
        this.create = this.create.bind(this)
        this.remove = this.remove.bind(this);
        this.update = this.update.bind(this)
    }


    //获取类型和标签
    async getCateTag(req, res, next) {
        try {
            let categories = await CategoryModel.find({}).select('name desc');
            let tags = await TagModel.find({}).select('name');
            res.retSuccess({
                data: {
                    categories,
                    tags
                },
            })
        } catch (err) {
            return next(err);
        }
    }

    /* 获取文章列表 getList
    	@param type ( 所有的文章，good精华文章)
    	@param flag (0删除，1草稿，2有效，''所有)
     */
    async getList(req, res, next) {
        let { page = 1, limit = 20, title = "", categoryId, author, type, startTime, endTime } = req.query;
        try {
            let queryParams = {
                status: 2,
                title,
                type,
                categoryId,
                startTime,
                endTime
            }
            if (author) {
                let user = await UserModel.findOne({ username: author });
                if (user) {
                    queryParams.author = user._id;
                }
            }
            let results = await ArticleService.getListToPage(queryParams, page, limit);
            res.retSuccess({
                data: results.data,
                total: results.total,
                limit: results.pageSize,
                page: results.page
            })
        } catch (err) {
            console.log('获取文章列表出错:' + err);
            return next(err);
        }
    }


    /* 获取文章列表 getListToAdmin 用于给管理员管理接口
    	@param type ( 所有的文章，good精华文章)
    	@param flag (0删除，1草稿，2有效，''所有)
     */
    async getListToAdmin(req, res, next) {
        let { page = 1, limit = 20, title = "", categoryId, author, status = 3, type, startTime, endTime } = req.query;
        try {
            let queryParams = {
                status,
                title,
                is_private: null,
                type,
                categoryId,
                startTime,
                endTime
            }
            if (author) {
                let user = await UserModel.findOne({ username: author });
                if (user) {
                    queryParams.author = user._id;
                }
            }
            let results = await ArticleService.getListToPage(queryParams, page, limit);
            res.retSuccess({
                data: results.data,
                total: results.total,
                limit: results.pageSize,
                page: results.page
            })
        } catch (err) {
            console.log('获取文章列表出错:' + err);
            return next(err);
        }
    }








    /* 获取当前登录用户的文章 getMeArticleById
     */
    async getMeArticleById(req, res, next) {
        const userId = req.userInfo._id;
        const id = req.params['id'];
        if (!validator.isMongoId(id)) {
            res.retError({
                type: 'ERROR_PARAMS',
                message: '文章ID参数错误'
            }, 404)
            return
        }
        try {
            let article = await ArticleService.getById(id);
            if (!article) {
                return res.retError({
                    message: '文章不存在'
                }, 404)
            }
            res.retSuccess({
                data: article
            })
        } catch (err) {
            return next(err);
        }
    }

    /* 获取用户的文章 getArticlesByUserId
    	@param type (me 我发表的文章，collect收藏的文章，like喜欢的文章,comment 评论过的文章
    	@param flag (0删除，1草稿，2有效，3所有)
     */
    async getArticlesByUserId(req, res, next) {
        let { page = 1, limit = 20, title = "", flag = 2, type = "me", startTime, endTime } = req.query;
        let queryParams = {
            title,
            status: 2,
            startTime,
            endTime
        };
        const userId = req.params['id'];
        const meId = req.userInfo ? req.userInfo._id : null;
        const isMe = String(meId) === String(userId);
        if (!validator.isMongoId(userId)) {
            res.retError({
                type: 'ERROR_PARAMS',
                message: '用户ID参数错误'
            }, 404)
            return
        }
        try {
            let user = await UserModel.findById(userId).select('-isAdmin -role -password -__v');
            if (!isMe) {
                if (!user || user.setting.show_main === 2) {
                    res.retError({
                        message: '您要查找的用户不存在，或者该用户开启了私密设置'
                    }, 404)
                    return
                }
            }
            if (type === "collect") {
                let collectIds = user.collectArts;
                queryParams.ids = collectIds;
            } else if (type === 'like') {
                let likeIds = user.likeArts;
                queryParams.ids = likeIds;
            } else if (type === 'comment') {
                let cmts = await CommentModel.find({ from: userId }).select('articleId');
                let artIds = cmts.map(item => item.articleId);
                let uniqArtIds = _.uniq(artIds); //去重
                queryParams.ids = uniqArtIds;
            } else { //我自己的文章
                queryParams.author = userId;
                queryParams.status = parseInt(flag);
                queryParams.is_private = null;
            }
            let results = await ArticleService.getListToPage(queryParams, page, limit)
            res.retSuccess({
                isMe,
                data: results.data,
                total: results.total,
                limit: results.pageSize,
                page: results.page
            });
        } catch (err) {
            console.log('获取文章列表出错:' + err);
            return next(err);
        }

    }

    //网站前台获取文章详情
    async getFrontArticle(req, res, next) {
        let id = req.params['id'];
        if (!validator.isMongoId(id)) {
            res.retError({
                type: 'ERROR_PARAMS',
                message: '文章ID参数错误'
            }, 404)
            return
        }
        try {
            var isFollow = false;
            var isLike = false;
            var isCollect = false;
            var md = new MarkdownIt({
                html: true //启用html标记转换
            });
            let article = await ArticleService.getById(id);
            if (!article||article.is_private||article.status==2) {
                return res.retError({
                    message: '文章不存在或已被删除'
                }, 404)
            }
            let me = req.userInfo;

            //如果是登录用户的话需要将改文章的收藏和关注、喜欢状态返回
            if (me) {
                me = await UserModel.findById(me._id);
                if (me.follows.indexOf(article.author._id) !== -1) {
                    isFollow = true;
                }
                if (me.collectArts.indexOf(article._id) !== -1) {
                    isCollect = true;
                }
                if (me.likeArts.indexOf(article._id) !== -1) {
                    isLike = true;
                }
            }

            await ArticleModel.updatePv(id);
            article.pv_num += 1;
            article.content = md.render(article.content);
            res.retSuccess({
                data: article,
                isFollow,
                isCollect,
                isLike
            });
        } catch (err) {
            console.log('获取文章出错', +err);
            return next(err);
        }
    }

    //根据id获取文章
    async findOneById(req, res, next) {
        let id = req.params['id'];
        if (!validator.isMongoId(id)) {
            res.retError({
                type: 'ERROR_PARAMS',
                message: '文章ID参数错误'
            }, 404)
            return
        }
        try {
            let article = await ArticleService.getById(id,);
            if (!article || article.status == 0 || article.is_private) {
                return res.retError({
                    msg: 'The article is not found or is deleted',
                    message: '文章不存在或已被删除'
                }, 404)
            }
            res.retSuccess({
                data: article,
            });
        } catch (err) {
            console.log('获取文章出错', +err);
            return next(err);
        }
    }

    async getArticlesByTagId(req, res, next) {
        let tagId = req.params['tag_id'];
        let { page = 1, pageSize = 100 } = req.query;
        if (!validator.isMongoId(tagId)) {
            return res.retError({
                type: 'ERROR_PARAMS',
                message: '标签ID参数错误'
            }, 404)
        }
        try {
            let results = await ArticleService.getListToPage({
                tagId
            }, page, pageSize);
            res.retSuccess({
                data: results.data,
                total: results.total,
                pageSize: results.pageSize
            });
        } catch (err) {
            console.log('获取文章出错' + err);
            return next(err);
        }
    }

    async getArticlesByCategoryId(req, res, next) {
        const cId = req.params['category_id'];
        let { page = 1, pageSize = 100 } = req.query;
        if (!validator.isMongoId(cId)) {
            res.retError({
                type: 'ERROR_PARAMS',
                message: '类型ID参数错误'
            }, 404);
            return
        }
        try {
            let queryParams = {
                'category': { '$in': [cId] }
            }
            let results = await ArticleService.getListToPage({
                categoryId: cId
            }, page, pageSize);
            res.retSuccess({
                data: results.data,
                total: results.total,
                pageSize: results.pageSize
            });
        } catch (err) {
            console.log('获取文章出错' + err);
            return next(err);
        }
    }

    //获取当前用户的草稿文章
    async getMeDrafts(req, res, next) {
        let authorId = req.userInfo._id;
        try {
            let drafts = await ArticleModel.find({ author: authorId, status: 1 }).select('content title')
                .populate('author', 'username avatar')
                .populate('category', 'name')
                .populate('tags', 'name');
            let has_draft = drafts.length > 0 ? true : false;
            res.retSuccess({
                data: drafts,
                has_draft
            });
        } catch (err) {
            console.log('获取草稿出错' + err);
            return next(err);
        }
    }



    //保存草稿
    async createDraft(req, res, next) {
        let article = req.body.article;
        article.author = req.userInfo._id;
        if (!article.content) {
            return res.send('ok')
        }
        try {
            if (article.id) {
                await ArticleModel.update({ _id: article.id, status: 1 }, {
                    content: article.content,
                    draft_time: Date.now(),
                })
                res.retSuccess({
                    id: article.id,
                    time: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                    has_draft: true,
                    message: '保存成功'
                });
            } else {
                let art = await new ArticleModel({
                    author: article.author,
                    content: article.content,
                    status: 1
                }).save();
                res.retSuccess({
                    id: art._id,
                    has_draft: true,
                    time: moment(art.create_time).format('YYYY-MM-DD HH:mm:ss'),
                    message: '保存成功'
                });
            }


        } catch (err) {
            console.log('保存出错' + err);
            return next(err);
        }

    }

    //发布文章，更新和新增可调用此方法
    async post_article(req, res, next, type) {
        let article = req.body.article;
        article.author = req.userInfo._id;
        let addNewTag = false;
        try {
            if (!article.title) {
                throw new Error('标题不得为空');
            } else if (!article.categoryName) {
                throw new Error('类型不得为空');
            } else if (!article.content) {
                throw new Error('文章内容不得为空！');
            }
        } catch (err) {
            console.log('参数出错', err.message);
            res.retError({
                type: 'ERROR_PARAMS',
                message: err.message
            });
            return
        }
        try {
            let query;
            if (type == 'update') {
                let id = req.params['id'];
                query = { _id: { $ne: id }, title: article.title, status: { $ne: 1 } };

            } else {
                query = { title: article.title, status: { $ne: 1 } };
            }
            let rart = await ArticleModel.findOne(query); //查询不是草稿的标题是否存在
            if (rart) {
                res.retError('文章标题已存在');
                return;
            }
            //检查category
            let ncate = await CategoryModel.findOne({ name: article.categoryName });
            if (!ncate) {
                return res.retError('文章类型不存在');
            } else {
                article.category = ncate._id;
            }
            if (article.tagNames && Array.isArray(article.tagNames)) {
                // let allTags = await TagModel.find({})
                // let allTagIds = allTags.map(item=>item._id);
                // let difTag = _.difference(allTagIds, article.tagNames);
                // console.log(difTag)
                //检查tag如果已有tag就查询获取tagid否则创建新的tag
                let Pro = article.tagNames.map((item) => {
                    return new Promise(function(resolve, reject) {
                        TagModel.findOne({ name: item }).then(function(d) {
                            if (d) {
                                resolve(d._id)
                            } else {
                                TagModel.create({ name: item }).then(function(newTag) {
                                    addNewTag = true;
                                    resolve(newTag._id);
                                })
                            }
                        }).catch(function(err) {
                            reject(err)
                        })
                    })
                })

                article.tags = await Promise.all(Pro);
            }

            if (req.file) {
                let nameArray = req.file.originalname.split('.')
                let type = nameArray[nameArray.length - 1];
                if (!tool.checkUploadImg(type)) {
                    return res.retError('文章封面格式错误');
                }
                let imgurl = await this.upload(req.file);
                article.img = imgurl;
            }

            if (type == 'update') { //更新
                let id = req.params['id'];
                article.status = 2
                let barticle = await ArticleModel.findById(id);
                if (barticle.status == 1) { //如果是草稿的话就把create_time 定为当前时间
                    article.create_time = Date.now();
                }
                let _article = _.extend(barticle, article);
                await _article.save();
                res.retSuccess({
                    addNewTag,
                    message: '更新成功'
                });
            } else { //新增
                await new ArticleModel(article).save();
                res.retSuccess({
                    addNewTag,
                    message: '发布成功'
                });
            }
        } catch (err) {
            console.log('文章发布出错' + err);
            return next(err);
        }
    }


    //新增
    create(req, res, next) {
        this.post_article(req, res, next)
    }

    //更新
    update(req, res, next) {
        this.post_article(req, res, next, 'update')
    }


    removeOne(item) {
        return new Promise(async function(resolve, reject) {
            try {
                if (item.status === 0 || item.status === 1) { //彻底删除
                    await ArticleModel.remove({
                        _id: item._id
                    })
                } else { //（假删除）
                    await ArticleModel.update({
                        _id: item._id
                    }, {
                        'status': 0
                    });
                }
                resolve('ok');
            } catch (err) {
                reject(err)
            }

        })
    }

    async remove(req, res, next) {
        const ids = req.params['id'].split(',');
        const userInfo = req.userInfo;
        try {
            let articles = await ArticleModel.find({ _id: { "$in": ids } });
            let pro = articles.map((item) => {
                return new Promise(async(resolve, reject) => {
                    try {
                        if (!item.is_private) { //不是私有的管理员可以删除
                            await this.removeOne(item);
                        } else if (item.is_private && item.author._id == userInfo._id) { //私有的只能作者可以删除
                            await this.removeOne(item);
                        }
                        resolve('ok');
                    } catch (err) {
                        reject(err)
                    }
                })
            })

            await Promise.all(pro);
            res.retSuccess('删除成功');

        } catch (err) {
            console.log('文章批量删除失败:' + err);
            return next(err);
        }

    }

    //点赞
    async toggleLike(req, res, next) {
        let aid = req.params['id'];
        let userId = req.userInfo._id;
        if (!validator.isMongoId(aid)) {
            res.retError({
                type: 'ERROR_PARAMS',
                message: '文章ID参数错误'
            });
            return
        }
        try {
            let article = await ArticleModel.findOne({ _id: aid, is_private: false });
            if (!article) {
                return res.retError('该文章不存在或已被删除');
            }
            let user = await UserModel.findOne({ _id: userId });
            let conditionOne, conditionTwo, like, count = 0;
            let isLikes = user.likeArts.indexOf(aid);
            if (isLikes !== -1) {
                conditionOne = { '$pull': { 'likeArts': aid } };
                conditionTwo = { '$inc': { 'like_num': -1 } };
                count = article.like_num - 1;
                like = false;
            } else {
                conditionOne = { '$addToSet': { 'likeArts': aid } };
                conditionTwo = { '$inc': { 'like_num': 1 } };
                like = true;
                count = article.like_num + 1;
            }
            await UserModel.update({ _id: userId }, conditionOne);
            await ArticleModel.update({ _id: aid }, conditionTwo);

            res.retSuccess({
                count: count,
                isLike: like
            });

        } catch (err) {
            console.log('点赞失败:' + err);
            return next(err);
        }
    }

    //收藏
    async toggleCollect(req, res, next) {
        let aid = req.params['id'];
        let userId = req.userInfo._id;
        if (!validator.isMongoId(aid)) {
            res.retError({
                type: 'ERROR_PARAMS',
                message: '文章ID参数错误'
            });
            return
        }
        try {
            let article = await ArticleModel.findOne({ _id: aid, is_private: false });
            if (!article) {
                return res.retError('该文章不存在或已被删除');
            }
            let user = await UserModel.findOne({ _id: userId });
            let isCollect = user.collectArts.indexOf(aid);

            let conditionOne, conditionTwo, collect, count = 0;
            if (isCollect !== -1) {
                conditionOne = { '$pull': { 'collectArts': aid } };
                conditionTwo = { '$inc': { 'collect_num': -1 } };
                count = article.collect_num - 1;
                collect = false;
            } else {
                conditionOne = { '$addToSet': { 'collectArts': aid } };
                conditionTwo = { '$inc': { 'collect_num': 1 } };
                count = article.collect_num + 1;
                collect = true;
            }
            await UserModel.update({ _id: userId }, conditionOne);
            await ArticleModel.update({ _id: aid }, conditionTwo);
            res.retSuccess({
                count: count,
                isCollect: collect,
                type: 'SUCCESS_TO_COLLECTION',
            });
        } catch (err) {
            console.log('操作失败:' + err);
            return next(err);
        }
    }

    //恢复已删除文章
    async recovery(req, res, next) {
        const ids = req.params['id'].split(',');
        try {
            await ArticleModel.update({ _id: { "$in": ids } }, { status: 2 });
            res.retSuccess('操作成功');
        } catch (err) {
            return next(err);
        }
    }








}