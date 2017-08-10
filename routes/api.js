"use strict";
//后台管理路由
import express  from 'express' 
import multer from 'multer'		
import moment from 'moment'

import ArticleCtrl from '../controllers/article.controller'
import CategoryCtrl from '../controllers/category.controller'
import TagCtrl from '../controllers/tag.controller'
import WordCtrl from '../controllers/word.controller'
import FriendCtrl from '../controllers/friend.controller'
import UserCtrl from '../controllers/user.controller'
import FileCtrl from '../controllers/file.controller'
import Auth from '../middleware/auth'

const router = express.Router();


//文件上传multer配置
const storage = multer.diskStorage({
	destination: "public/upload/",
	limits: {
		fileSize: 100000000
	},
	filename: function(req, file, cb) {
		var fileFormat = (file.originalname).split(".");
		cb(null, file.fieldname + '-' + Date.now() + "." + fileFormat[fileFormat.length - 1]);
	}
});

//添加配置文件到muler对象。
const upload = multer({
	storage: storage
});

//获取文章
router.get('/articles',ArticleCtrl.getArticles);
//根据id获取
router.get('/articles/:article_id',ArticleCtrl.getArticleById);
//文章发布
router.post('/articles',Auth.checkAdmin, upload.single('cover'),ArticleCtrl.create);
//文章更新
router.put('/articles/:article_id',Auth.checkAdmin, upload.single('cover'),ArticleCtrl.update);
//更新文章pv
router.put('/articles/:article_id/pv',ArticleCtrl.updatePv);
//文章删除(单项)
router.delete('/articles/:article_id',Auth.checkAdmin,ArticleCtrl.deleteOne);
//文章删除（多选)
router.post('/articles/removeMulti', Auth.checkAdmin,ArticleCtrl.deleteMulti);
//文章点赞
router.put('/articles/:article_id/likes',Auth.checkLoginByAjax,ArticleCtrl.addLikes);
//获取文章评论
router.get('/articles/:article_id/comments',ArticleCtrl.getComments);
//文章评论
router.post('/articles/:article_id/comments',Auth.checkLoginByAjax,ArticleCtrl.addComment);
//评论点赞
router.post('/comments/:comment_id/like',Auth.checkLoginByAjax,ArticleCtrl.addCommentLike);


//获取category数据
router.get("/categories",CategoryCtrl.getCategories);
//获取某一分类下的文章
router.get("/categories/:category_id/articles",ArticleCtrl.getArticlesByCategoryId);
//分类添加
router.post("/categories", Auth.checkAdmin,CategoryCtrl.add);
//分类更新
router.put("/categories/:category_id", Auth.checkAdmin,CategoryCtrl.update);
//分类删除
router.delete('/categories/:category_id', Auth.checkAdmin,CategoryCtrl.remove);

//获取标签数据
router.get('/tags',TagCtrl.getTags);
//获取标签下的文章
router.get('/tags/:tag_id/articles',ArticleCtrl.getArticlesByTagId);
//新增标签
router.post('/tags', Auth.checkAdmin,TagCtrl.add);
//更新标签
router.put('/tags/:tag_id', Auth.checkAdmin, TagCtrl.update);
//删除标签
router.delete('/tags/:tag_id', Auth.checkAdmin,TagCtrl.remove);

//获取友情链接数据 
router.get('/friends',FriendCtrl.getFriends);
//添加友情链接
router.post('/friends',Auth.checkAdmin,FriendCtrl.add);
//更新友链
router.put('/friends/:friend_id', Auth.checkAdmin,FriendCtrl.update);
//删除友情链接
router.delete('/friends/:friend_id', Auth.checkAdmin,FriendCtrl.remove);


//获取注册用户
router.get('/users', Auth.checkAdmin, UserCtrl.getUsers)
////登陆
router.post('/user/login',UserCtrl.login);
//注册
router.post('/user/regist',UserCtrl.regist);
//退出
router.get('/user/logout',UserCtrl.logout);
//管理员登陆
router.post('/user/admin_login',UserCtrl.admin_login);
//管理员注册
router.post('/user/admin_regist',UserCtrl.admin_regist);
//管理员退出
router.get('/user/admin_logout',UserCtrl.admin_logout)



//获取留言
router.get('/words',Auth.checkAdmin,WordCtrl.getWords);
//提交留言
router.post('/words',Auth.checkLoginByAjax,WordCtrl.add);
//留言回复
router.put('/words/:id', Auth.checkAdmin,WordCtrl.reply);



//添加文件
router.post('/upload/addFile', upload.single('file'), FileCtrl.addFile);
//添加banner
router.post('/upload/addBanner', upload.single('banner'),FileCtrl.addBanner)
//获取所有文件
router.get('/allFiles', Auth.checkAdmin, FileCtrl.getFiles);
//下载文件
router.get('/download', FileCtrl.download);


export default router;