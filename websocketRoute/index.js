const Router = require('koa-router');

const router = new Router({
    prefix: '/websocket'
});

// 用于存储管理员的 websocket 连接实例对象
global.wsAdminMap = {};
// 用于存储用户的 websocket 连接实例对象
global.wsUserMap = {};

// from 来源管理员 id
// to 去向用户 id
router.all('/admin/:from', async (ctx, next) => {
    const {from} = ctx.params;
    if(!global.wsAdminMap[from]){
        global.wsAdminMap[from] = ctx.websocket;
    }
    // 接收到管理员发送的消息后，将消息推送给相应的用户
    global.wsAdminMap[from].on('message', async message => {
        const {remark, create_time, to} = JSON.parse(message);
        // 添加消息到数据库
        // 第一步：先要查询 message 表中有没有相关联的数据，没有则添加
        const data = await global.mysql.query(`SELECT * FROM message WHERE user_id=${to} AND admin_id=${from}`, ctx);
        let message_id = -1;
        if(data.length > 0){
            message_id = data[0].id;
        }else{
            await global.mysql.insert(`INSERT INTO message(admin_id, user_id) VALUES(${from}, ${to})`, ctx);
            // 获取刚刚插入数据的 id
            const MaxId = await global.mysql.query(`SELECT max(id) FROM message`, ctx);
            message_id = MaxId[0]['max(id)'];
        }
        // 插入相应的消息详情数据
        await global.mysql.insert(`INSERT INTO message_detail(remark, from_id, to_id, message_id, create_time, from_flag) VALUES('${remark}', ${from}, ${to}, ${message_id}, '${create_time}', 'admin')`, ctx);
        if(global.wsUserMap[to]){
            // 查询刚刚插入的 message_detail 数据
            const data = await global.mysql.query(`SELECT * FROM message_detail WHERE message_id=${message_id} ORDER BY id desc LIMIT 1`, ctx);
            global.wsUserMap[to].send(JSON.stringify(data[0]));
        }else{
            global.wsAdminMap[from].send(JSON.stringify({
                id: -1,
                remark: '[自动回复]你好，我现在有事不在，一会再和你联系。',
                from_id: to,
                to_id: from,
                message_id: -1,
                from_flag: 'user'
            }));
        }
    });
    // 连接关闭时，将相应的 websocket 连接删除
    global.wsAdminMap[from].on('close', event => {
        delete global.wsAdminMap[from];
    });
    await next();
});

// from 来源用户 id
// to 去向管理员 id
router.all('/user/:from', async (ctx, next) => {
    const {from} = ctx.params;
    if(!global.wsUserMap[from]){
        global.wsUserMap[from] = ctx.websocket;
    }
    // 接收到用户发送的消息后，将消息推送给相应的管理员
    global.wsUserMap[from].on('message', async message => {
        const {remark, create_time, to} = JSON.parse(message);
        // 添加消息到数据库
        // 第一步：先要查询 message 表中有没有相关联的数据，没有则添加
        const data = await global.mysql.query(`SELECT * FROM message WHERE user_id=${from} AND admin_id=${to}`, ctx);
        let message_id = -1;
        if(data.length > 0){
            message_id = data[0].id
        }else{
            await global.mysql.insert(`INSERT INTO message(admin_id, user_id) VALUES(${to}, ${from})`, ctx);
            // 获取刚刚插入数据的 id
            const MaxId = await global.mysql.query(`SELECT max(id) FROM message`, ctx);
            message_id = MaxId[0]['max(id)'];
        }
        // 插入相应的消息详情数据
        await global.mysql.insert(`INSERT INTO message_detail(remark, from_id, to_id, message_id, create_time, from_flag) VALUES('${remark}', ${from}, ${to}, ${message_id}, '${create_time}', 'user')`, ctx);
        if(global.wsAdminMap[to]){
            // 查询刚刚插入的 message_detail 数据
            const data = await global.mysql.query(`SELECT * FROM message_detail WHERE message_id=${message_id} ORDER BY id desc LIMIT 1`, ctx);
            global.wsAdminMap[to].send(JSON.stringify(data[0]));
        }else{
            global.wsUserMap[from].send(JSON.stringify({
                id: -1,
                remark: '[自动回复]你好，我现在有事不在，一会再和你联系。',
                from_id: to,
                to_id: from,
                message_id: -1,
                from_flag: 'admin'
            }));
        }
    });
    // 连接关闭时，将相应的 websocket 连接删除
    global.wsUserMap[from].on('close', event => {
        delete global.wsUserMap[from];
    });
    await next();
});


module.exports = router;