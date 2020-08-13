const Router = require('koa-router');

const router = new Router({
    prefix: '/user/good'
});

// 查询商品
router.get('/list', async (ctx, next) => {
    const {currentPage, keyword} = ctx.request.query;
    const startIndex = (currentPage - 1) * 10;
    const endIndex = currentPage * 10;
    const data = await global.mysql.query(`SELECT * FROM good WHERE name LIKE '%${keyword}%' AND statu=0 LIMIT ${startIndex},${endIndex}`, ctx);
    ctx.body = global.responseTool.success(data);
    await next();
});

// 查询单个商品
router.get('/infoById', async (ctx, next) => {
    const {id} = ctx.request.query;
    // redis 缓存中有相应的数据，则不从 mysql 数据库中读取数据，直接读取缓存数据返回即可
    // 反之，则读取数据库数据，并将数据存储到 redis 缓存中
    const redisData = await global.redis.get(id);
    if(redisData){
        ctx.body = global.responseTool.success(JSON.parse(redisData));
    }else{
        const data = await global.mysql.query(`SELECT * FROM good WHERE id=${id}`, ctx);
        // 缓存当前商品信息，设置 1 小时的有效期
        global.redis.set(id, JSON.stringify(data[0]), 3600);
        ctx.body = global.responseTool.success(data[0]);
    }
    await next();
});

// 查询多个商品
router.post('/listByIds', async (ctx, next) => {
    const {ids} = ctx.request.body;
    const promises = ids.map(id => {
        return new Promise(async (resolve, reject) => {
            const data = await global.mysql.query(`SELECT * FROM good WHERE id=${id}`, ctx);
            resolve(data[0]);
        });
    });
    const data = await Promise.all(promises);
    ctx.body = global.responseTool.success(data);
    await next();
});

module.exports = router;