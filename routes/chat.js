"use strict";
//后台管理路由
import express  from 'express' 

import {ChatCtrl} from '../controllers'
import Auth from '../middleware/auth'
import upload from '../middleware/upload'

const router = express.Router();

//获取聊天室用户融云信息
router.get('/users/:userId/info', ChatCtrl.getChatUserInfo)
//获取当前聊天室用户融云token
router.get('/userToken',Auth.checkToken, ChatCtrl.getRongToken)

export default router;