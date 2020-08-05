// 验证管理员信息中间件
const paths = require('../config/route/noVerifyPath');
const rootPaths = require('../config/route/noVerifyRootPath');

// 验证用户登录是否失效
module.exports = async (ctx, next) => {
    // 不需要进行登录验证的 path，直接跳过走下个中间件
    if(paths.indexOf(ctx.path) !== -1 || rootPaths.indexOf(ctx.path.split('/')[1]) !== -1){
        await next();
    }else{
        if(ctx.session && ctx.session.adminId){
            await next();
        }else{
            ctx.body = global.responseTool.fail('重新登陆', 403);
            // return;
        }
    }
}