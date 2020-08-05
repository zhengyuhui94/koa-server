const Router = require('koa-router');

const router = new Router({
    prefix: '/user/address'
});

// 添加收货地址
router.post('/add', async (ctx, next) => {
    const {name, area, mobile, address, user_id} = ctx.request.body;
    await global.mysql.insert(`INSERT INTO address(name, area, mobile, address, user_id, statu) VALUES('${name}', '${area}', '${mobile}', '${address}', ${user_id}, 1)`, ctx);
    ctx.body = global.responseTool.success('添加成功');
    await next();
});

// 更新收货地址信息
router.post('/update', async (ctx, next) => {
    const {id, name, area, mobile, address, user_id, statu} = ctx.request.body;
    // 如果 statu 是 0，则需要先将当前用户下其他 statu 为 0 的地址状态修改为 1
    if(statu === 0){
        await global.mysql.update(`UPDATE address SET statu=1 WHERE user_id=${user_id} AND statu=0`, ctx);   
    }
    await global.mysql.update(`UPDATE address SET statu=0, name='${name}', area='${area}', mobile='${mobile}', address='${address}' WHERE id=${id}`, ctx);
    ctx.body = global.responseTool.success('保存成功');
    await next();
});

// 删除收货地址
router.post('/del', async (ctx, next) => {
    const {id} = ctx.request.body;
    await global.mysql.delete(`DELETE FROM address WHERE id=${id}`,ctx);
    ctx.body = global.responseTool.success('删除成功');
    await next();
});

// 根据用户 id 查询收货地址
router.get('/list', async (ctx, next) => {
    const {user_id} = ctx.request.query;
    const data = await global.mysql.query(`SELECT * FROM address WHERE user_id=${user_id}`, ctx);
    ctx.body = global.responseTool.success(data);
    await next();
});

// 根据收货地址 id 查询数据
router.get('/queryById', async (ctx, next) => {
    const {id} = ctx.request.query;
    const data = await global.mysql.query(`SELECT * FROM address WHERE id=${id}`, ctx);
    ctx.body = global.responseTool.success(data[0]);
    await next();
});

// 根据用户 id 获取默认收货地址
router.get('/queryDefault', async (ctx, next) => {
    const {user_id} = ctx.request.query;
    const data = await global.mysql.query(`SELECT * FROM address WHERE user_id=${user_id} AND statu=0`, ctx);
    ctx.body = global.responseTool.success(data[0]);
    await next();
});

module.exports = router;