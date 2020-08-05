const Router = require('koa-router');

const router = new Router({
    prefix: '/goodManage/category'
});

// 添加商品分类
router.post('/add', async (ctx, next) => {
    const {adminId} = ctx.session;
    const {name} = ctx.request.body;

    // 验证该商品分类是否已存在于该用户 category 表中
    const data = await global.mysql.query(`SELECT * FROM category WHERE admin_id=${adminId} AND name='${name} AND statu=0'`, ctx);
    if(data.length > 0){
        ctx.body = global.responseTool.fail('该商品分类已被存在');
        return;
    }

    await global.mysql.insert(`INSERT INTO category(name, admin_id, statu) VALUES ('${name}', ${adminId}, 0)`, ctx);
    ctx.body = global.responseTool.success(true, '添加成功');
    await next();
});

// 分页查询未删除的商品分类信息
router.get('/list', async (ctx, next) => {
    const {adminId} = ctx.session;
    const {currentPage, pageSize} = ctx.request.query;
    // startIndex 查询的第一条数据的索引
    // endIndex 查询的最后一条数据的索引
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = currentPage * pageSize;
    const data = await global.mysql.query(`SELECT * FROM category WHERE admin_id=${adminId} AND statu=0 LIMIT ${startIndex},${endIndex}`, ctx);
    const count = await global.mysql.query(`SELECT COUNT(*) as total FROM category WHERE admin_id=${adminId} AND statu=0`, ctx);
    ctx.body = global.responseTool.success({
        data,
        total: count[0].total
    });
    await next();
});

// 查询当前用户下的所有未删除的商品分类信息
router.get('/allList', async (ctx, next) => {
    const {adminId} = ctx.session;
    const data = await global.mysql.query(`SELECT * FROM category WHERE admin_id=${adminId} AND statu=0`, ctx);
    ctx.body = global.responseTool.success(data);
    await next();
});

// 删除商品类目
router.post('/del', async (ctx, next) => {
    const {id} = ctx.request.body;
    // 删除商品类目之前，先判断该类目下有没有商品，
    // 如果有的话，需要先将商品删除完，才能删除商品类目
    const data = await global.mysql.query(`SELECT * FROM good WHERE category_id=${id} AND statu!=1`, ctx);
    if(data.length > 0){
        ctx.body = global.responseTool.fail('该类目下有商品，不能删除');
        return; 
    }
    await global.mysql.update(`UPDATE category SET statu=1 WHERE id=${id}`, ctx);
    ctx.body = global.responseTool.success(true, '删除成功');
    await next();
});

module.exports = router;