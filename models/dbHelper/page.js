
export default class Page{
	constructor(model,page,pageSize) {
		this.model = model;
		this.page = page;
		this.pageSize = pageSize;
	}

	setPage(page=1){
		this.page=parseInt(page);
	}

	setPageSize(pageSize=10){
		this.pageSize=parseInt(pageSize);
	}

	getData(queryParams,populate,sortParams){
		return new Promise(async (resolve,reject)=>{
			try{
				let page = this.page,
					pageSize = this.pageSize,
					skip = pageSize * (page-1);
				let total = await this.model.count(queryParams);
				let data = await this.model.find(queryParams)
							.skip(skip).limit(pageSize)
							.populate(populate).sort(sortParams);
				resolve({
					page,
					pageSize,
					total,
					data
				})			
			}catch(err){
				reject(err)
			}
			
		})
	}
}
