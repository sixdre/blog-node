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

//首页统计
router.get('/graph',graphCtrl.graph);


//获取注册用户
router.get('/users', Auth.checkToken,Auth.checkAdmin, UserCtrl.getList)
//删除用户
router.delete('/users/:id', Auth.checkToken,Auth.checkAdmin, UserCtrl.remove)
//更新用户角色
router.post('/users/:id/role', Auth.checkToken,UserCtrl.updateRole)
//管理员注册
router.post('/login',UserCtrl.admin_login);
//管理员注册
router.post('/regist',UserCtrl.admin_regist);


//获取所有文件
router.get('/allFiles', Auth.checkToken,Auth.checkAdmin, FileCtrl.getList);
//添加文件
router.post('/upload/addFile', upload.any(), FileCtrl.addFile);	//.any() 为不限制上传文件名称
//添加banner
router.post('/upload/addBanner', upload.single('banner'),FileCtrl.addBanner)
//下载文件
router.get('/download', FileCtrl.download);







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