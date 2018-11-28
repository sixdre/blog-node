/**
 * Created by xuhao on 2017/1/12.
 */
// let mongodb = 'mongodb://127.0.0.1/blog';
let mongodb = 'mongodb://47.107.229.206/blog';
//let allowOrigin = 'http://localhost:8099';
let allowOrigin = '*';
if (process.env.NODE_ENV === 'production') {
    // mongodb = 'mongodb://root:123456@47.94.206.86:27017/blog?authSource=admin'
    allowOrigin = 'http://47.107.229.206:3000';
}

const config = {
    mongodb: mongodb,
    session: {
        name: 'SID',
        secret: 'SID',
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60 * 24,
        }
    },
    secret: 'blog',
    allowOrigin: allowOrigin,
    qiniu_config: {
        accessKey: 'hM5qMEJfJNy2thESXZB2MMAx6H83mGGaeMAwyFfb',
        secretKey: 'bNVNnsynNTyY9wbVS5KIybQrCSnNvs5g1WeZybaa',
        bucket: 'myblog',
        origin: 'http://osf6cl53d.bkt.clouddn.com/'
    },
    ryAppSecret: 'ea155oOKnvvC2v', //融云即时通讯appSecret,
    ryAppKey: 'qd46yzrfqibvf' //融云即时通讯appKey,
}

export default config;