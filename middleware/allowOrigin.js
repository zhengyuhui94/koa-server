// 添加响应头的中间件
module.exports = async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    await next();
}