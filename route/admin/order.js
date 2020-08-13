const Router = require('koa-router');

const router = new Router({
    prefix: '/admin/order'
});

// 获取管理员下的所有订单信息
router.get('/list', async (ctx, next) => {
    const {adminId} = ctx.session;
    let {currentPage, pageSize, statu} = ctx.request.query;
    // startIndex 查询的第一条数据的索引
    // endIndex 查询的最后一条数据的索引
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = currentPage * pageSize;

    let whereStr = `WHERE order_info.admin_id=${adminId}`;
    if(statu !== ''){
        statu = Number(statu);
        if(statu === 0 || statu === 1 || statu === 2 || statu === 3){
            whereStr = `${whereStr} AND order_info.statu=${statu}`;
        }
    }

    const data = await global.mysql.query(`SELECT order_info.*, user.name as user_name, user.avatar as user_avatar, order_detail.good_count, good.id as good_id, good.name as good_name, good.img as good_img, good.price as good_price, evaluate.id as evaluate_id, evaluate.remark, evaluate.statu as evaluate_statu FROM order_info LEFT JOIN user ON order_info.user_id=user.id LEFT JOIN order_detail ON order_info.id=order_detail.order_id LEFT JOIN good ON order_detail.good_id=good.id LEFT JOIN evaluate ON order_detail.good_id=evaluate.good_id AND order_info.id=evaluate.order_id ${whereStr} ORDER BY order_info.id desc LIMIT ${startIndex},${endIndex}`, ctx);
    // 获取商品评价图片
    if(data.length > 0){
        const promises = data.map(item => {
            return new Promise(async (resolve, reject) => {
                const result = await global.mysql.query(`SELECT img FROM evaluate_img WHERE evaluate_id=${item.evaluate_id}`, ctx);
                item.imgs = result.map(resultItem => {
                    return resultItem.img;
                });
                resolve();
            });
        });
        await Promise.all(promises);
    }
    const count = await global.mysql.query(`SELECT COUNT(*) as total FROM order_info ${whereStr}`, ctx);
    ctx.body = global.responseTool.success({
        data,
        total: count[0].total
    });
    await next();
});

module.exports = router;