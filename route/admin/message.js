const Router = require('koa-router');

const router = new Router({
    prefix: '/admin/message'
});

// 获取当前管理员下面的消息的所有用户列表
router.get('/userList', async (ctx, next) => {
    const {adminId} = ctx.session;
    const data = await global.mysql.query(`SELECT message.*, user.name, user.avatar FROM message LEFT JOIN user ON message.user_id=user.id WHERE admin_id=${adminId}`, ctx);
    ctx.body = global.responseTool.success(data);
    await next();
});

// 分页查询消息数据
router.post('/listById', async (ctx, next) => {
    const {currentPage, pageSize, message_id} = ctx.request.body;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = currentPage * pageSize;
    const data = await global.mysql.query(`SELECT * FROM message_detail WHERE message_id=${message_id} ORDER BY id desc LIMIT ${startIndex},${endIndex}`, ctx);
    ctx.body = global.responseTool.success(data);
    await next();
});

// 根据 user_id 和 admin_id 获取 message_id
router.post('/getMessageId', async (ctx, next) => {
    const {adminId} = ctx.session;
    const {user_id} = ctx.request.body;
    const data = await global.mysql.query(`SELECT * FROM message WHERE user_id=${user_id} AND admin_id=${adminId}`, ctx);
    ctx.body = global.responseTool.success(data);
    await next();
});

module.exports = router;