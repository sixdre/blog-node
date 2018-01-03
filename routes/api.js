"use strict";
//后台管理路由
import express  from 'express' 
import multer from 'multer'		

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


router.del = router.delete;

//获取文章
router.get('/articles',ArticleCtrl.getArticles);
//根据id获取
router.get('/articles/:id',ArticleCtrl.findOneById);
//文章发布
router.post('/articles',Auth.checkToken, upload.single('cover'),ArticleCtrl.create);
//文章更新
router.put('/articles/:id',Auth.checkToken, upload.single('cover'),ArticleCtrl.update);
//更新文章pv
router.put('/articles/:id/pv',ArticleCtrl.updatePv);
//文章删除
router.del('/articles/:id',Auth.checkToken,ArticleCtrl.remove);
//文章点赞
router.put('/articles/:id/likes',Auth.checkLoginByAjax,ArticleCtrl.addLikes);

//获取文章评论
router.get('/comments/article/:article_id',ArticleCtrl.getComments);
//文章评论
router.post('/comments/article/:article_id',Auth.checkLoginByAjax,ArticleCtrl.addComment);
//评论点赞
router.post('/comments/:comment_id/like',Auth.checkLoginByAjax,ArticleCtrl.addCommentLike);


//获取category数据
router.get("/categories",CategoryCtrl.getCategories);
//获取指定的category
router.get("/categories/:id", CategoryCtrl.findOneById);
//获取某一分类下的文章
router.get("/categories/:category_id/articles",ArticleCtrl.getArticlesByCategoryId);
//分类添加
router.post("/categories", Auth.checkToken,CategoryCtrl.create);
//分类更新
router.put("/categories/:id", Auth.checkToken,CategoryCtrl.update);
//分类删除
router.del('/categories/:id', Auth.checkToken,CategoryCtrl.remove);

//获取标签数据
router.get('/tags',TagCtrl.getTags);
//获取指定id的标签
router.get('/tags/:id', TagCtrl.findOneById);
//获取标签下的文章
router.get('/tags/:tag_id/articles',ArticleCtrl.getArticlesByTagId);
//新增标签
router.post('/tags', Auth.checkToken,TagCtrl.create);
//更新标签
router.put('/tags/:id', Auth.checkToken, TagCtrl.update);
//删除标签
router.del('/tags/:id', Auth.checkToken,TagCtrl.remove);

//获取友情链接数据 
router.get('/friends',FriendCtrl.getFriends);
//添加友情链接
router.post('/friends',Auth.checkToken,FriendCtrl.add);
//更新友链
router.put('/friends/:id', Auth.checkToken,FriendCtrl.update);
//删除友情链接
router.del('/friends/:id', Auth.checkToken,FriendCtrl.remove);


//获取注册用户
router.get('/users', Auth.checkToken, UserCtrl.getUsers)
//获取当前登录用户信息
router.get('/userInfo', Auth.checkToken, UserCtrl.getUserInfo)
//登陆
router.post('/login',UserCtrl.login);
//注册
router.post('/regist',UserCtrl.regist);
//退出
router.get('/logout',UserCtrl.logout);
//管理员登陆
router.post('/admin_login',UserCtrl.admin_login);
//管理员注册
router.post('/admin_regist',UserCtrl.admin_regist);
//管理员退出
router.get('/admin_logout',UserCtrl.admin_logout)



//获取留言
router.get('/words',WordCtrl.getWords);
//提交留言
router.post('/words',Auth.checkLoginByAjax,WordCtrl.add);
//留言回复
router.put('/words/:id', Auth.checkToken,WordCtrl.reply);



//添加文件
router.post('/upload/addFile', upload.single('file'), FileCtrl.addFile);
//添加banner
router.post('/upload/addBanner', upload.single('banner'),FileCtrl.addBanner)
//获取所有文件
router.get('/allFiles', Auth.checkToken, FileCtrl.getFiles);
//下载文件
router.get('/download', FileCtrl.download);


export default router;