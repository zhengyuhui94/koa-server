const Router = require('koa-router');
const axios = require('axios');

const router = new Router({
    prefix: '/user/info'
});

// 根据登录 code，获取微信用户的唯一标识 openid
router.post('/getOpenid', async (ctx, next) => {
    const {code} = ctx.request.body;
    const {data} = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
            appid: 'wxc8a2191ae1eb8947',
            secret: 'e6dea1b446efa35a96f21cb1d40db8dd',
            js_code: code,
            grant_type: 'authorization_code'
        }
    });
    ctx.body = global.responseTool.success(data);
    await next();
});

// 添加用户，如果没有先添加在查询返回用户信息
router.post('/qureyByOpenid', async (ctx, next) => {
    const {openid} = ctx.request.body;
    let data = await global.mysql.query(`SELECT * FROM user WHERE openid='${openid}'`, ctx);
    if(data.length === 0){
        await global.mysql.insert(`INSERT INTO user(openid, money) VALUES('${openid}', 20000)`, ctx);
        data = await global.mysql.query(`SELECT * FROM user WHERE openid='${openid}'`, ctx);
    }
    ctx.body = global.responseTool.success(data[0]);
    await next();
});

// 更新用户表中的用户信息
router.post('/updateById', async (ctx, next) => {
    const {id, name, avatar} = ctx.request.body;
    await global.mysql.update(`UPDATE user SET name='${name}', avatar='${avatar}' WHERE id=${id}`, ctx);
    ctx.body = global.responseTool.success('更新成功');
    await next();
});

// 根据用户 id 查询用户信息
router.get('/queryById', async (ctx, next) => {
    const {id} = ctx.request.query;
    const data = await global.mysql.query(`SELECT * FROM user WHERE id=${id}`, ctx);
    ctx.body = global.responseTool.success(data[0]);
    await next();
});

module.exports = router;