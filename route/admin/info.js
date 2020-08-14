const Router = require('koa-router');

const router = new Router({
    prefix: '/admin'
});

// 根据 id 获取管理员信息
router.get('/getInfoById', async (ctx, next) => {
    const {adminId} = ctx.session;
    const data = await global.mysql.query(`SELECT * from admin WHERE id=${adminId}`, ctx);
    const {id, name, avatar, remark, sex, birthday, remark_file} = data[0];
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.body = global.responseTool.success({
        id,
        name,
        avatar,
        remark,
        sex,
        birthday,
        remark_file
    });
    await next();
});

// 更新管理员头像
router.post('/updateAvatar', async (ctx, next) => {
    const {adminId} = ctx.session;
    let {avatar} = ctx.request.body;
    await global.mysql.update(`UPDATE admin SET avatar='${avatar}' WHERE id=${adminId}`, ctx).then(() => {
        ctx.body = global.responseTool.success(true, '头像更新成功');
    });
    await next();
});

// 更新管理员信息
router.post('/updateInfo', async (ctx, next) => {
    const {adminId} = ctx.session;
    let {remark, sex, birthday, remark_file} = ctx.request.body;
    await global.mysql.update(`UPDATE admin SET remark='${remark}', sex='${sex}', birthday='${birthday}', remark_file='${remark_file}' WHERE id=${adminId}`, ctx).then(() => {
        ctx.body = global.responseTool.success(true, '保存成功');
    });
    await next();
});

module.exports = router;