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
        accessKey:'hM5qMEJfJNy2thESXZB2MMAx6H83mGGaeMAwyFfb',
        secretKey:'bNVNnsynNTyY9wbVS5KIybQrCSnNvs5g1WeZybaa',
        bucket: 'myblog',
        origin: 'http://osf6cl53d.bkt.clouddn.com/'
    }
}

export default config;