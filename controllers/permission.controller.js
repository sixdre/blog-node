import {PermissionModel,MenuModel,RoleModel} from '../models/'
import transformTozTreeFormat from '../utility/tree'
import validator from 'validator'

class PermissionController {
	constructor() {
		
	}
	//获取前端页面菜单
	async getMenus(req,res,next){
		try{
			let menus = await MenuModel.find({},{'__v':0,'meta':0});
			let data = transformTozTreeFormat(JSON.parse(JSON.stringify(menus)))
			res.json({
				menus,
				data
			})
		}catch(err){
			return next(err);
		}
	}
	
	//创建菜单
	async createMenu(req,res,next){
		let {pid,path,name,icon,hidden} = req.body;
		if(validator.isEmpty(path)||validator.isEmpty(name)){
			return res.json({
				code:0,
				msg:'参数缺失'
			})
		}
		try{
			let menu = await MenuModel.findOne({path:path},{'__v':0});
			if(menu){
				return res.json({
					code:0,
					msg:'已有改类型菜单'
				})
			}
			await MenuModel.create({pid,path,name,icon,hidden});
			res.json({
				code:1,
				msg:'菜单新增成功'
			})
		}catch(err){
			return next(err);
		}
	}
	
	//更新菜单
	async updateMenu(req,res,next){
		let id = req.params['id'];
		let {path,name,icon,hidden} = req.body;
		if(validator.isEmpty(path)||validator.isEmpty(name)){
			return res.json({
				code:0,
				msg:'参数缺失'
			})
		}
		try{
			let obj = {		
				path,
				name,
				icon,
				hidden
			}
			await MenuModel.update({_id:id},obj);
			res.json({
				code:1,
				msg:'菜单更新成功'
			})
		}catch(err){
			return next(err);
		}
	}
	
	//删除菜单
	async removeMenu(req,res,next){
		let id = req.params['id'];
		try{
			await MenuModel.remove({'_id':id})
			res.json({
				code:1,
				msg:'菜单删除成功'
			})
		}catch(err){
			return next(err);
		}
	}
	
	//创建权限
	async createPermission(req,res,next){
		let {name,resource,type,tag} = req.body;
		try{
			let obj = {		//创建
				name,
				resource,
				type,
				tag
			}
			await PermissionModel.create(obj);
			res.json({
				code:1,
				msg:'权限创建成功'
			})
		}catch(err){
			return next(err);
		}
		
	}
	
	
	//更新权限
	async updatePermission(req,res,next){
		let id = req.params['id'];
		let {name,resource,type,tag} = req.body;
		try{
			let obj = {		//创建
				name,
				resource,
				type,
				tag
			}
			await PermissionModel.update({'_id':id},obj);
			res.json({
				code:1,
				msg:'权限更新成功'
			})
		}catch(err){
			return next(err);
		}
	}
	
	//获取权限列表
	async getPermissionList(req,res,next){
		let {page=1,limit=5,group=0} = req.query;
			page = Number(page),
			limit = Number(limit);
			try {
				if (group == 0) {
					let skip = (page-1)*limit;
					let count = await PermissionModel.count();
					let permissions = await PermissionModel.find({})
						.skip(skip).limit(limit)
					res.json({
						code: 1,
						count,
						data:permissions,
						msg:'权限列表获取成功'
					})
				} else {
					let data = await PermissionModel.aggregate([
						{ $group: { '_id': "$tag", data: { $push: { '_id': '$_id', 'resource':'$resource', 'name': '$name' } } } }]);
					res.json({
						code: 1,
						data,
						msg:'权限列表获取成功'
					})
				}
		
		}catch(err){
			return next(err);
		}
	}
	
	//创建角色
	async createRole(req,res,next){
		let name = req.body.name;
		try{
			let role = await RoleModel.findOne({name: name});
			if(role){
				res.json({
					code:0,
					msg:'角色名称已存在'
				})
				return ;
			}
			await RoleModel.create({name:name});
			res.json({
				code:1,
				msg:'创建成功'
			})
		}catch(err){
			return next(err);
		}
	}
	
	//获取所有的角色
	async getRoles(req,res,next){
		try{
			let roles = await RoleModel.find({});
			res.json({
				code:1,
				data:roles,
				msg:'获取成功'
			})
		}catch(err){
			return next(err);
		}
	}
	
	//根据角色来获取相应的权限
	async getPermissionByRoleId(req,res,next){
		const roleId = req.params['id'];
		try{
			let role = await RoleModel.findById(roleId);
			if(!role){
				res.json({
					code:0,
					msg:'没有找到该角色'
				})
				return ;
			}
			let {permissionIds,menuIds} = role;
			let permissions = await PermissionModel.find({'_id':{'$in':permissionIds}})
			let menus = await MenuModel.find({'_id':{'$in':menuIds}})		
			let menuTree = transformTozTreeFormat(JSON.parse(JSON.stringify(menus)));
			res.json({
				code:1,
				permissionIds,
				menuIds,
				menus,
				menuTree,
				permissions,
				msg:'角色权限获取成功'
			})
			
		}catch(err){
			return next(err);
		}
		
	}
	
	/*
	 * saveRolePermission  
	 * desc(保存角色的权限) 
	 * */
	async saveRolePermission(req,res,next){
		let roleId = req.params['id'];
		let {menuIds,permissionIds} = req.body;
		
		try{
			let role = await RoleModel.findById(roleId);
			if(!role){
				res.json({
					code:0,
					msg:'没有找到该角色'
				})
				return ;
			}
			//先排下序
			menuIds.sort(function(a,b) { return a - b });
			permissionIds.sort(function(a,b) { return a - b });
			
			await RoleModel.update({'_id':roleId},{menuIds:menuIds,permissionIds:permissionIds})
			res.json({
				code:1,
				msg:'创建成功'
			})
		}catch(err){
			return next(err);
		}
	}
	
	
}



export default new PermissionController();