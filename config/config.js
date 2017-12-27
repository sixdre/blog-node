/**
 * Created by xuhao on 2017/1/12.
 */
let mongodb = 'mongodb://localhost/blog';

if (process.env.NODE_ENV == 'development') {
	
}else if(process.env.NODE_ENV == 'production'){
	mongodb = 'mongodb://root:123456@localhost:27017/blog?authSource=blog'
}

const config={
    mongodb:mongodb,
    session: {
		name: 'SID',
		secret: 'SID',
		cookie: {
			httpOnly: true,
		    secure:   false,
		    maxAge:   1000 * 60 * 60 * 24,
		}
	},
	secret:'blog',
	qiniu_config:{
        accessKey:'hM5qMEJfJNy2thESXZB2MMAx6H83mGGaeMAwyFfb',
        secretKey:'bNVNnsynNTyY9wbVS5KIybQrCSnNvs5g1WeZybaa',
        bucket: 'myblog',
        origin: 'http://osf6cl53d.bkt.clouddn.com/'
    }
}

export default config;