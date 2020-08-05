const Router = require('koa-router');

const router = new Router({
    prefix: '/user/admin'
});

// 根据 id 获取管理员信息
router.get('/getInfoByAdminId', async (ctx, next) => {
    const {admin_id} = ctx.request.query;
    const data = await global.mysql.query(`SELECT * from admin WHERE id=${admin_id}`, ctx);
    const {id, name, avatar} = data[0];
    ctx.body = global.responseTool.success({
        id,
        name,
        avatar
    });
    await next();
});

module.exports = router;