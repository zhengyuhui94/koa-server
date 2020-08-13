const Router = require('koa-router');

const router = new Router({
    prefix: '/user/message'
});

// 获取当前用户下面的消息的所有管理员列表
router.get('/adminList', async (ctx, next) => {
    const {user_id} = ctx.request.query;
    const data = await global.mysql.query(`SELECT message.*, admin.name, admin.avatar FROM message LEFT JOIN admin ON message.admin_id=admin.id WHERE user_id=${user_id}`, ctx);
    ctx.body = global.responseTool.success(data);
    await next();
});

// 分页查询消息数据
router.post('/listById', async (ctx, next) => {
    const {currentPage, pageSize, message_id} = ctx.request.body;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = currentPage * pageSize;
    const data = await global.mysql.query(`SELECT message_detail.*, user.name as user_name, user.avatar as user_avatar, admin.name as admin_name, admin.avatar as admin_avatar FROM message_detail LEFT JOIN message ON message_detail.message_id=message.id LEFT JOIN admin ON message.admin_id=admin.id LEFT JOIN user ON message.user_id=user.id WHERE message_id=${message_id} ORDER BY id desc LIMIT ${startIndex},${endIndex}`, ctx);
    ctx.body = global.responseTool.success(data);
    await next();
});

// 根据 message_id 批量查询最新一条消息
router.post('/lastInfoByIds', async (ctx, next) => {
    const {message_ids} = ctx.request.body;
    const promises = message_ids.map(message_id => {
        return new Promise(async resolve => {
            const data = await global.mysql.query(`SELECT * FROM message_detail WHERE message_id=${message_id} ORDER BY id DESC LIMIT 1`, ctx);
            resolve(data[0]);
        });
    });
    const data = await Promise.all(promises);
    ctx.body = global.responseTool.success(data);
    await next();
});

// 根据 user_id 和 admin_id 获取 message_id
router.post('/getMessageId', async (ctx, next) => {
    const {user_id, admin_id} = ctx.request.body;
    const data = await global.mysql.query(`SELECT * FROM message WHERE user_id=${user_id} AND admin_id=${admin_id}`, ctx);
    ctx.body = global.responseTool.success(data);
    await next();
});

module.exports = router;