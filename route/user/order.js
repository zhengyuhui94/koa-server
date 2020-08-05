const Router = require('koa-router');

const router = new Router({
    prefix: '/user/order'
});

// 创建订单
router.post('/add', global.mysql.transactions(
    async (ctx, next, connection) => {
        const {user_id, admin_id, total_price, create_time, address_mobile, address_name, address_area, address, good_info, statu, cart_detail_ids, cart_id} = ctx.request.body;
        await global.mysql.insert(`INSERT INTO order_info(user_id, admin_id, total_price, create_time, address_mobile, address_name, address_area, address, statu) VALUES(${user_id}, ${admin_id}, ${total_price}, '${create_time}', '${address_mobile}', '${address_name}', '${address_area}', '${address}', ${statu})`, ctx, connection);
        // 获取 order 表中，最新插入的一条数据的 id【在这里即为刚成功创建的订单 id】
        const MaxIdres = await global.mysql.query(`SELECT max(id) FROM order_info`, ctx, connection);
        const order_id = MaxIdres[0]['max(id)'];
        const promises = good_info.map(item => {
            const {good_id, good_count} = item;
            return new Promise(async (resolve, reject) => {
                await global.mysql.insert(`INSERT INTO order_detail(order_id, good_id, good_count) VALUES(${order_id}, ${good_id}, ${good_count})`, ctx, connection);
                resolve();
            });
        });
        await Promise.all(promises);
        // 如果订单是已付款状态，则订单创建完成之后，扣除用户 money，增加 admin money
        if(statu === 1){
            await global.mysql.update(`UPDATE user SET money=money-${total_price} WHERE id=${user_id}`, ctx, connection);
            await global.mysql.update(`UPDATE admin SET money=money+${total_price} WHERE id=${admin_id}`, ctx, connection);
        }
        // 从购物车中下单时，需要传递该参数，并删除相应购物车数据
        if(cart_id){
            // 删除当前购物车及购物车中的所有商品
            if(cart_id !== -1){
                await global.mysql.update(`UPDATE cart_detail SET statu=1 WHERE cart_id=${cart_id}`, ctx, connection);
                await global.mysql.update(`UPDATE cart SET statu=1 WHERE id=${cart_id}`, ctx, connection);
            }else{ // 删除购物车中选中的商品
                const promises2 = cart_detail_ids.map((item) => {
                    return new Promise(async (resolve, reject) => {
                        await global.mysql.update(`UPDATE cart_detail SET statu=1 WHERE id=${item}`, ctx, connection);
                        resolve();
                    });
                });
                await Promise.all(promises2);
            }
        }
        ctx.body = global.responseTool.success(true, '订单创建成功');
        await next();
    }
));

// 查询订单数据
router.get('/list', async (ctx, next) => {
    let {user_id, statu} = ctx.request.query;
    let whereStr = `WHERE order_info.user_id=${user_id}`;
    // 解决 Number('') 等于 0 的问题
    if(statu !== ''){
        statu = Number(statu);
        if(statu === 0 || statu === 1 || statu === 2 || statu === 3){
            whereStr = `${whereStr} AND order_info.statu=${statu}`;
        }
    }   
    const data = await global.mysql.query(`SELECT order_info.id, order_info.admin_id, order_info.total_price, order_info.statu, order_detail.good_id, order_detail.good_count, good.name as good_name, good.img as good_img, good.price as good_price, admin.name, admin.avatar FROM order_info LEFT JOIN order_detail ON order_info.id=order_detail.order_id LEFT JOIN good ON order_detail.good_id=good.id LEFT JOIN admin ON order_info.admin_id=admin.id ${whereStr} ORDER BY order_info.id DESC`, ctx);
    ctx.body = global.responseTool.success(data);
    await next();
});

// 改变订单状态
router.post('/changeStatu', global.mysql.transactions(
    async (ctx, next, connection) => {
        const {statu, id, total_price, user_id, admin_id} = ctx.request.body;
        await global.mysql.update(`UPDATE order_info SET statu=${statu} WHERE id=${id}`, ctx, connection);
        // 如果订单改变为已付款状态，则扣除用户 money，增加 admin money
        if(statu === 1){
            await global.mysql.update(`UPDATE user SET money=money-${total_price} WHERE id=${user_id}`, ctx, connection);
            await global.mysql.update(`UPDATE admin SET money=money+${total_price} WHERE id=${admin_id}`, ctx, connection);
        }
        ctx.body = global.responseTool.success(true, '付款成功');
        await next();
    }
));

module.exports = router;