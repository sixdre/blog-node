"use strict";
//后台管理路由
import express  from 'express' 
import multer from 'multer'		
import UUID  from 'uuid'
import {ArticleCtrl,CategoryCtrl,CommentCtrl,
	TagCtrl,WordCtrl,FriendCtrl,
	UserCtrl,FileCtrl,permissionCtrl} from '../controllers'
import Auth from '../middleware/auth'

const router = express.Router();

//文件上传multer配置
const storage = multer.diskStorage({
	destination: "public/upload/",
	limits: {
		fileSize: 100000000
	},
	filename: function(req, file, cb) {
		//console.log(file)
		var fileFormat = (file.originalname).split(".");
		cb(null, UUID.v4() + "." + fileFormat[fileFormat.length - 1]);
	}
});

//添加配置文件到muler对象。
const upload = multer({
	storage: storage
});


router.del = router.delete;


//获取登录用户的文章
router.get('/articles/me',Auth.checkToken,ArticleCtrl.getMyArticles);
//获取精华文章
router.get('/articles/goodArticles',ArticleCtrl.getGoodArticles);
//获取文章
router.get('/articles',ArticleCtrl.get);
//前台获取文章
router.get('/articles/:id/front',ArticleCtrl.getFrontArticle);
//根据id获取文章详情
router.get('/articles/:id',ArticleCtrl.findOneById);
//文章发布
router.post('/articles',Auth.checkToken,Auth.checkAdmin, upload.single('cover'),ArticleCtrl.create);
//文章更新
router.put('/articles/:id',Auth.checkToken,Auth.checkAdmin, upload.single('cover'),ArticleCtrl.update);
//文章删除
router.del('/articles/:id',Auth.checkToken,Auth.checkAdmin,ArticleCtrl.remove);
//文章点赞
router.put('/articles/:id/likes',Auth.checkToken,ArticleCtrl.toggleLike);
//文章收藏
router.put('/articles/:id/collect',Auth.checkToken,ArticleCtrl.toggleCollect);


//获取文章评论
router.get('/articles/:article_id/comments',CommentCtrl.getCommentsByArticleId);
//文章评论
router.post('/articles/:article_id/comments',Auth.checkToken,CommentCtrl.addComment);
//评论点赞
router.post('/comments/:comment_id/like',Auth.checkToken,CommentCtrl.addCommentLike);








/*类型*/


//获取category数据
router.get("/categories",CategoryCtrl.get);
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
router.get('/tags',TagCtrl.get);
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
router.get('/friends',FriendCtrl.get);
//添加友情链接
router.post('/friends',Auth.checkToken,Auth.checkAdmin,FriendCtrl.create);
//更新友链
router.put('/friends/:id', Auth.checkToken,Auth.checkAdmin,FriendCtrl.update);
//删除友情链接
router.del('/friends/:id', Auth.checkToken,Auth.checkAdmin,FriendCtrl.remove);


//获取留言
router.get('/words',WordCtrl.get);
//提交留言
router.post('/words',Auth.checkToken,WordCtrl.create);
//留言回复
router.put('/words/:id', Auth.checkToken,Auth.checkAdmin,WordCtrl.reply);



//获取所有文件
router.get('/allFiles', Auth.checkToken,Auth.checkAdmin, FileCtrl.get);
//添加文件
router.post('/upload/addFile', upload.any(), FileCtrl.addFile);	//.any() 为不限制上传文件名称
//添加banner
router.post('/upload/addBanner', upload.single('banner'),FileCtrl.addBanner)
//下载文件
router.get('/download', FileCtrl.download);




//获取注册用户
router.get('/users', Auth.checkToken,Auth.checkAdmin, UserCtrl.get)
//删除用户
router.delete('/users/:id', Auth.checkToken,Auth.checkAdmin, UserCtrl.remove)
//更新用户信息
router.put('/users/:id', Auth.checkToken,UserCtrl.update)
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














router.get('/menus',permissionCtrl.getMenus);
router.post('/menus',permissionCtrl.createMenu);
router.put('/menus/:id',permissionCtrl.updateMenu);
router.delete('/menus/:id',permissionCtrl.removeMenu);
router.get('/permissions',permissionCtrl.getPermissionList);
router.post('/permissions',permissionCtrl.createPermission);
router.put('/permissions/:id',permissionCtrl.updatePermission);
router.get('/roles',permissionCtrl.getRoles);
router.post('/roles',permissionCtrl.createRole);
router.get('/roles/:id/permission',permissionCtrl.getPermissionByRoleId);
router.post('/roles/:id/permission',permissionCtrl.saveRolePermission);




export default router;