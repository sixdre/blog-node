"use strict";
//后台管理路由
import express  from 'express' 
import {ArticleCtrl,CategoryCtrl,CommentCtrl,
	TagCtrl,WordCtrl,FriendCtrl,
	UserCtrl,FileCtrl,permissionCtrl,graphCtrl} from '../controllers'
import Auth from '../middleware/auth'
import upload from '../middleware/upload'
const router = express.Router();


router.del = router.delete;



//获取标签和类型统一接口
router.get('/catetag',ArticleCtrl.getCateTag);

//获取用户的草稿文章
router.get('/me/drafts',Auth.checkToken,ArticleCtrl.getMeDrafts);

//获取当前用户的文章(包括收藏，点赞，评论，喜欢)
router.get('/users/:id/articles',Auth.getLoginUserInfo,ArticleCtrl.getArticlesByUserId);
//获取用户关注的用户
router.get('/users/:id/follows',Auth.getLoginUserInfo,UserCtrl.getFollowsById);
//获取用户的粉丝(关注我的用户)
router.get('/users/:id/fans',Auth.getLoginUserInfo,UserCtrl.getFansById);
//获取用户的个人信息,粉丝数量，关注数量，文章数量
router.get('/users/:id/info',Auth.getLoginUserInfo,UserCtrl.getInfoById);




//更新用户信息
router.put('/users/:id', Auth.checkToken,UserCtrl.update)
//关注用户
router.put('/users/:id/follow', Auth.checkToken,UserCtrl.toggleFollow)
//获取当前登录用户信息
router.get('/userInfo', Auth.checkToken, UserCtrl.getUserInfo)
//登陆
router.post('/login',UserCtrl.login);
//前台注册
router.post('/regist',UserCtrl.regist);










//草稿保存
router.post('/draft',Auth.checkToken,ArticleCtrl.createDraft);
//获取文章
router.get('/articles',ArticleCtrl.getList);
//前台获取文章详情
router.get('/articles/:id/front',Auth.getLoginUserInfo,ArticleCtrl.getFrontArticle);
//根据id获取文章详情
router.get('/articles/:id',ArticleCtrl.findOneById);
//文章发布
router.post('/articles',Auth.checkToken,upload.single('cover'),ArticleCtrl.create);
//文章更新
router.put('/articles/:id',Auth.checkToken,upload.single('cover'),ArticleCtrl.update);
//文章删除
router.del('/articles/:id',Auth.checkToken,ArticleCtrl.remove);
//文章点赞
router.put('/articles/:id/likes',Auth.checkToken,ArticleCtrl.toggleLike);
//文章收藏
router.put('/articles/:id/collect',Auth.checkToken,ArticleCtrl.toggleCollect);


/*评论*/
//获取文章评论
router.get('/articles/:article_id/comments',Auth.getLoginUserInfo,CommentCtrl.getCommentsByArticleId);
//文章评论
router.post('/articles/:article_id/comments',Auth.checkToken,CommentCtrl.addComment);
//评论点赞
router.put('/comments/:comment_id/like',Auth.checkToken,CommentCtrl.addCommentLike);





/*类型*/

//获取category数据
router.get("/categories",CategoryCtrl.getList);
//获取指定的category
router.get("/categories/:id", CategoryCtrl.findOneById);
//获取某一分类下的文章
router.get("/categories/:category_id/articles",ArticleCtrl.getArticlesByCategoryId);
//分类添加
router.post("/categories", Auth.checkToken,Auth.checkAdmin,CategoryCtrl.create);
//分类更新
router.put("/categories/:id", Auth.checkToken,Auth.checkAdmin,CategoryCtrl.update);
//分类删除
router.del('/categories/:id', Auth.checkToken,Auth.checkAdmin,CategoryCtrl.remove);



/*标签*/
//获取标签数据
router.get('/tags',TagCtrl.getList);
//获取指定id的标签
router.get('/tags/:id', TagCtrl.findOneById);
//获取标签下的文章
router.get('/tags/:tag_id/articles',ArticleCtrl.getArticlesByTagId);
//新增标签
router.post('/tags', Auth.checkToken,Auth.checkAdmin,TagCtrl.create);
//更新标签
router.put('/tags/:id', Auth.checkToken, Auth.checkAdmin,TagCtrl.update);
//删除标签
router.del('/tags/:id', Auth.checkToken,Auth.checkAdmin,TagCtrl.remove);

//获取友情链接数据 
router.get('/friends',FriendCtrl.getList);
//添加友情链接
router.post('/friends',Auth.checkToken,Auth.checkAdmin,FriendCtrl.create);
//更新友链
router.put('/friends/:id', Auth.checkToken,Auth.checkAdmin,FriendCtrl.update);
//删除友情链接
router.del('/friends/:id', Auth.checkToken,Auth.checkAdmin,FriendCtrl.remove);


//获取留言
router.get('/words',WordCtrl.getList);
//提交留言
router.post('/words',Auth.checkToken,WordCtrl.create);
//留言回复
router.put('/words/:id', Auth.checkToken,Auth.checkAdmin,WordCtrl.reply);













export default router;