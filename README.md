# 
# 博客系统 node服务端


整个项目分为两部分：前台项目接口、后台管理接口。涉及登陆、注册、发表文章、文章管理、文章点赞，收藏，友情链接管理、用户留言、文章评论、用户管理，文件管理，网站设置等，基本完成了一个博客系统所需的基础功能。


# 说明

>  如果对您对此项目有兴趣，可以点 "Star" 支持一下 谢谢！ ^_^

>  线上部署环境 阿里云轻量应用服务器Node.js centos7 

## 技术栈

nodejs + express + mongodb + mongoose + es6/7 + babel



## 项目运行

```
git clone https://github.com/sixdre/blog-node  

cd blog-node

npm install 这里推荐使用淘宝的npm镜像   输入npm install -g cnpm --registry=https://registry.npm.taobao.org 进行安装

npm install -g nodemon

npm run dev (请确保已经安装了mongodb数据库并且已经开启)	


```


# 效果演示

### 线上网址
[网站地址](http://47.94.206.86:3000/)	暂时使用ip访问

### 后台管理系统线上网址
[后台管理网址](http://47.94.206.86:3001/)	暂时使用ip访问


# 相关项目
[后台管理项目地址](https://github.com/sixdre/blog_manage_vue)