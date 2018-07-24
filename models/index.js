import Article from './article/article.model'
import Category from './article/category.model'
import Comment from './article/comment.model'
import Tag from './article/tag.model'

import Friend from './friend/friend.model'
import User from './user/user.model'
import Word from './word/word.model'
import Menu from './permission/menu.model'
import Permission from './permission/permission.model'
import Role from './permission/role.model'
import File from './file.model'
import Banner from './banner.model'

import Message from './chat/message.model'
import Socket from './chat/socket.model'
import Conversation from './chat/conversation.model'

export const MessageModel = Message;
export const SocketModel = Socket;
export const ConversationModel = Conversation;

export const ArticleModel = Article;
export const BannerModel = Banner;
export const CategoryModel = Category;
export const CommentModel = Comment;
export const FileModel = File;
export const FriendModel = Friend;
export const TagModel = Tag;
export const UserModel = User;
export const WordModel = Word;

export const MenuModel = Menu;
export const PermissionModel = Permission;
export const RoleModel = Role;

