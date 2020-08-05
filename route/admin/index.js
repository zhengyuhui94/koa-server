const Router = require('koa-router');
const cryptoTool = require('../../util/cryptoTool');

const router = new Router({
    prefix: '/admin'
});

// session 缺点：涉及到集群【多台服务器】时，不同服务器之前无法共享 session，
// 【除非使用特殊方法，能使不同服务器的 session 数据共享，一般很消耗性能】，这时单点登陆一般就要使用 redis 来处理了
// 管理员注册
router.post('/register', async (ctx, next) => {
    let {userName, password} = ctx.request.body;
    const data = await global.mysql.query(`SELECT * from admin WHERE name='${userName}'`, ctx);

    if(data.length > 0){
        ctx.body = global.responseTool.fail('该用户已被注册');
        return;
    }

    // 对用户密码进行加密处理
    password = cryptoTool.hash(password);

    await global.mysql.insert(`INSERT INTO admin(name, password) VALUES ('${userName}', '${password}')`, ctx).then(() => {
        ctx.body = global.responseTool.success(true, '注册成功');
    });
    await next();
});

// 管理员登录
router.get('/login', async (ctx, next) => {
    let {userName, password} = ctx.query;
    await global.mysql.query(`SELECT * from admin WHERE name='${userName}'`, ctx).then(data => {
        // 对用户密码进行加密处理并与数据库获取到的密码进行比较
        password = cryptoTool.hash(password);
        if(data.length > 0){
            // 用户密码正确，登录成功
            if(data[0].password === password){
                ctx.session.adminId = data[0].id;
                ctx.body = global.responseTool.success(true, '登录成功');
            }else{ 
                ctx.body = global.responseTool.fail('密码错误');
            }
        }else{
            ctx.body = global.responseTool.fail('该用户不存在');
        }
    });
    await next();
});

// 管理员退出登录
router.post('/logout', async (ctx, next) => {
    ctx.session = null;
    ctx.body = global.responseTool.success(true, '退出成功');
    await next();
});

module.exports = router;