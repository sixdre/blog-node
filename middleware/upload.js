import multer from 'multer'	
import UUID  from 'uuid'
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

export default upload