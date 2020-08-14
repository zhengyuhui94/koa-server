const Koa = require('koa');
const koaWebsocket = require('koa-websocket');
const app = koaWebsocket(new Koa());
const path = require('path');
const koaBody = require('koa-body');
const session = require('koa-session');
const koaStatic = require('koa-static');
// 混合配置
const mixinRouter = require('./mixin/router');
const mixinMiddleware = require('./mixin/middleware');
const mixinWebsocketRouter = require('./mixin/websocketRouter');
// 全局添加方法对象
global.mysql = require('./mysql');
global.responseTool = require('./util/responseTool');
// redis 缓存类
global.redis = require('./redis');
// 日志类
const logger = require('./util/log');

// 签名 cookie 所需的密钥
app.keys = ['some secret hurr'];

// 添加 session 配置
app.use(session({
    key: 'sso.mall.com',
    maxAge: 3600000
}, app));

// 解析 post 请求参数，包含上传的文件
app.use(koaBody({
    multipart: true, // 支持文件上传
    // encoding: 'gzip',
    formidable: {
        // uploadDir: path.join(__dirname,'static/image/'), // 设置文件上传目录
        keepExtensions: true, // 保持文件的后缀
        maxFieldsSize: 20 * 1024 * 1024 // 文件上传大小
        // onFileBegin(name, file){ // 文件上传前的设置
        //     console.log(`上传文件前的设置：${name}`);
        //     console.log(file);
        // }
    }
}));

// 配置静态资源中间件
app.use(koaStatic(path.join(__dirname, 'static')));

// 设置跨域中间件，需要设置在所有响应之前
app.use(async (ctx, next) => {
    // 解决跨域的 origin
    // 当设置 Access-Control-Allow-Credentials 为 true 时，必须要指定特定的跨域 origin，
    // 不能设置为 *
    ctx.set('Access-Control-Allow-Origin', ctx.headers.origin);
    // 允许跨域时，获取客户端域名的 cookie
    ctx.set('Access-Control-Allow-Credentials', true);
    // 跨域时携带的参数类型默认只能解析以下三种MIME类型：
    // application/x-www-form-urlencoded、multipart/form-data 或 text/plain 
    // 不包括参数，即 application/json，如果要支持的话，需要添加该响应头
    ctx.set('Access-Control-Allow-Headers', 'content-type');
    // 允许的跨域方法
    ctx.set('Access-Control-Allow-Methods', 'OPTIONS,GET,HEAD,PUT,POST,DELETE,PATCH');
    await next();
});

// 处理错误的中间件
app.use(async (ctx, next) => {
    try {
        await next();
    }catch(err){
        console.log('server error ============>');
        console.log(err);
        // 记录错误信息日志
        logger.error(err.message);
        ctx.status = err.statusCode || err.status || 500;
        ctx.body = {
            message: err.message
        };
    }
});

// 混合中间件配置
mixinMiddleware().then(middlewares => {
    middlewares.forEach(middlewareItem => {
        app.use(middlewareItem);
    });
});

// 混合并读取 router 文件配置
mixinRouter().then(routers => {
    routers.forEach(routerItem => {
        app.use(routerItem.routes()).use(routerItem.allowedMethods());
    });
});

// 混合并读取 websocket router 文件配置
mixinWebsocketRouter().then(routers => {
    routers.forEach(routerItem => {
        app.ws.use(routerItem.routes()).use(routerItem.allowedMethods());
    });
});

app.listen(8081);

console.log('listening on port 8081');