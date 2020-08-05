const Router = require('koa-router');

const router = new Router({
    prefix: '/user/cart'
});

// 添加商品到购物车
router.post('/addGood', async (ctx, next) => {
    // 先看当前用户在管理员那里是否有订单
    // 有的话，就添加订单详情并关联那个订单 id
    // 没有的话，就根据当前用户和管理员添加一个订单
    const {user_id, admin_id, good_id, good_count, good_price, good_name, good_img} = ctx.request.body;
    let data = await global.mysql.query(`SELECT * FROM cart WHERE user_id=${user_id} AND admin_id=${admin_id} AND statu=0`, ctx);
    if(data.length === 0){
        await global.mysql.insert(`INSERT INTO cart(user_id, admin_id, statu) VALUES(${user_id}, ${admin_id}, 0)`, ctx);
        data = await global.mysql.query(`SELECT * FROM cart WHERE user_id=${user_id} AND admin_id=${admin_id} AND statu=0`, ctx); 
    }
    const cart_id = data[0].id;
    // 添加订单详情，并管理订单 id
    // 先根据购物车 id 和商品 id去购物车详情中去查数据，
    // 没有的话，就新添加
    // 有的话，就更新数量
    let detailData = await global.mysql.query(`SELECT * FROM cart_detail WHERE cart_id=${cart_id} AND good_id=${good_id} AND statu=0`, ctx);
    if(detailData.length === 0){
        await global.mysql.insert(`INSERT INTO cart_detail(cart_id, good_id, good_count, good_price, good_name, good_img, statu) VALUES(${cart_id}, ${good_id}, ${good_count}, ${good_price}, '${good_name}', '${good_img}', 0)`, ctx);
    }else{
        await global.mysql.update(`UPDATE cart_detail SET good_count=${detailData[0].good_count + good_count} WHERE cart_id=${cart_id} AND good_id=${good_id} AND statu=0`, ctx);
    }
    ctx.body = global.responseTool.success(true, '商品添加成功');
    await next();
});

// 根据用户 id 进行关联表查询购物车的所有商品数据
router.get('/list', async (ctx, next) => {
    const {user_id} = ctx.request.query;
    const data = await global.mysql.query(`SELECT cart.user_id, cart.admin_id, cart_detail.id, cart_detail.cart_id, cart_detail.good_id, cart_detail.good_count, cart_detail.good_price, cart_detail.good_name, cart_detail.good_img, good.statu, admin.avatar, admin.name FROM cart LEFT JOIN admin ON cart.admin_id=admin.id LEFT JOIN cart_detail ON cart.id=cart_detail.cart_id LEFT JOIN good ON good.id=cart_detail.good_id WHERE cart.user_id=${user_id} AND cart.statu=0 AND cart_detail.statu=0`, ctx);
    ctx.body = global.responseTool.success(data);
    await next();
});

// 根据多个 order_detail id 查询商品数据
router.get('/queryByIds', async (ctx, next) => {
    const {ids} = ctx.request.query;
    const promises = ids.split(',').map(item => {
        return new Promise(async (resolve, reject) => {
            const data = await global.mysql.query(`SELECT * FROM cart_detail WHERE id=${Number(item)}`);
            resolve(data[0]);
        });
    });
    const datas = await Promise.all(promises);
    ctx.body = global.responseTool.success(datas);
    await next();
});

// 更新购物车商品数量
router.post('/changeGoodCount', async (ctx, next) => {
    const {good_count, id} = ctx.request.body;
    await global.mysql.update(`UPDATE cart_detail SET good_count=${good_count} WHERE id=${id}`, ctx);
    ctx.body = global.responseTool.success(true, '数量更新成功');
    await next();
});

// 删除购物车 cart 表中的数据以及 cart_detail 中关联的购物车商品详情数据
router.post('/delAll', global.mysql.transactions(
    async (ctx, next, connection) => {
        const {id} = ctx.request.body;
        await global.mysql.update(`UPDATE cart_detail SET statu=1 WHERE cart_id=${id}`, ctx, connection);
        await global.mysql.update(`UPDATE cart SET statu=1 WHERE id=${id}`, ctx, connection);
        ctx.body = global.responseTool.success(true, '删除成功');
        await next();
    }
));

// 删除 cart_detail 中关联的购物车商品详情数据
router.post('/delSomeGood', async (ctx, next) => {
    const {ids} = ctx.request.body;
    const promises = ids.map((item) => {
        return new Promise(async (resolve, reject) => {
            await global.mysql.update(`UPDATE cart_detail SET statu=1 WHERE id=${item}`, ctx);
            resolve();
        });
    });
    await Promise.all(promises).then(() => {
        ctx.body = global.responseTool.success(true, '删除成功');
    });
    await next();
});

module.exports = router;