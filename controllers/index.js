import ArticleController from './article/article.controller'
import CategoryController from './article/category.controller'
import TagController from './article/tag.controller'
import CommentController from './article/comment.controller'
import WordController from './word/word.controller'
import FriendController from './site/friend.controller'
import FileController from './site/file.controller'
import UserController from './user/user.controller'
import permissionController from './permission/permission.controller'
import graphController from './graph/graph.controller'
import ChatController from './chat/chat.controller'




export const ArticleCtrl = new ArticleController();
export const CategoryCtrl = new CategoryController();
export const CommentCtrl = new CommentController();
export const TagCtrl = new TagController();
export const WordCtrl = new WordController();
export const FriendCtrl = new FriendController();
export const UserCtrl = new UserController();
export const FileCtrl = new FileController();
export const permissionCtrl = new permissionController();
export const graphCtrl = new graphController();
export const ChatCtrl = new ChatController();


