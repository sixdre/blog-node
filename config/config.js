/**
 * Created by xuhao on 2017/1/12.
 */
const config={
    mongodb:"mongodb://localhost/blog",
    session: {
		name: 'SID',
		secret: 'SID',
		cookie: {
			httpOnly: true,
		    secure:   false,
		    maxAge:   1000 * 60 * 60 * 24,
		}
	},
	qiniu_config:{
        accessKey:'',		//youself accessKey
        secretKey:'',		//youself secretKey
        bucket: '',			//bucket 空间名
        origin: '',			//地址
    }
}

export default config;