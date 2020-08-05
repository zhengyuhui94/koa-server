const Router = require('koa-router');

const router = new Router({
    prefix: '/user/evaluate'
});

// 对订单中的商品发布商品评价
// 评价完之后，将订单状态改为已评价状态
router.post('/add', global.mysql.transactions(
    async (ctx, next, connection) => {
        const {order_id, user_id, create_time, list} = ctx.request.body;
        const promises = list.map(item => {
            return new Promise(async (resolve) => {
                // 插入评价表数据
                await global.mysql.insert(`INSERT INTO evaluate(remark, order_id, user_id, good_id, create_time, statu) VALUES('${item.remark}', ${order_id}, ${user_id}, ${item.good_id}, '${create_time}', ${item.statu})`, ctx, connection);
                // 获取刚刚插入的评价表 id
                // 出现的问题【在这里不能使用 max(id)】：在多次插入的时候，会导致当前获取的最大 id，始终是最后一个
                // const MaxId =await global.mysql.query(`SELECT max(id) FROM evaluate`, ctx, connection);
                // 这里换成查询 id 的方式来解决问题
                const data = await global.mysql.query(`SELECT id FROM evaluate WHERE order_id=${order_id} AND good_id=${item.good_id}`, ctx, connection);
                // 插入多个评价图片表数据
                const promises2 = item.imgs.map(imgItem => {
                    return new Promise(async (resolve2) => {
                        await global.mysql.insert(`INSERT INTO evaluate_img(evaluate_id, img) VALUES(${data[0].id}, '${imgItem}')`, ctx, connection);
                        resolve2();
                    });
                }); 
                await Promise.all(promises2);
                resolve();
            });
        });
        // 多个评价图片表数据插入成功之后，改变订单状态
        await Promise.all(promises);
        // 改变订单表状态
        await global.mysql.update(`UPDATE order_info SET statu=2 WHERE id=${order_id}`, ctx, connection);
        ctx.body = global.responseTool.success(true, '评价成功');
        await next();
    }
));

// 根据商品 id 查询最多两条好的评价信息以及相关的用户信息
router.get('/queryByGoodId/twoGood', async (ctx, next) => {
    const {good_id} = ctx.request.query;
    const data = await global.mysql.query(`SELECT evaluate.*, user.name, user.avatar FROM evaluate LEFT JOIN user ON evaluate.user_id=user.id WHERE good_id=${good_id} AND statu=3 LIMIT 2`, ctx);
    ctx.body = global.responseTool.success(data);
    await next();
});

// 根据商品 id 查询商品评价的总数量
router.get('/queryByGoodId/total', async (ctx, next) => {
    const {good_id} = ctx.request.query;
    const count = await global.mysql.query(`SELECT COUNT(*) as total FROM evaluate WHERE good_id=${good_id}`, ctx);
    ctx.body = global.responseTool.success(count[0].total);
    await next();
});

// 根据商品 id 查询商品评价
router.get('/queryByGoodId/list', async (ctx, next) => {
    let {good_id, statu} = ctx.request.query;
    let whereStr = `WHERE evaluate.good_id=${good_id}`;
    // 根据评价状态获取数据
    statu = Number(statu);
    if(statu === 1 || statu === 2 || statu === 3){
        whereStr = `${whereStr} AND evaluate.statu=${statu}`;
    }
    const data = await global.mysql.query(`SELECT evaluate.*, user.name, user.avatar FROM evaluate LEFT JOIN user ON evaluate.user_id=user.id ${whereStr}`, ctx);
    // 获取商品评价图片
    if(data.length > 0){
        const promises = data.map(item => {
            return new Promise(async (resolve, reject) => {
                const result = await global.mysql.query(`SELECT img FROM evaluate_img WHERE evaluate_id=${item.id}`, ctx);
                item.imgs = result.map(resultItem => {
                    return resultItem.img;
                });
                resolve();
            });
        });
        await Promise.all(promises);
    }
    ctx.body = global.responseTool.success(data);
    await next();
});

module.exports = router;