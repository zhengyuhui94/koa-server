const redis = require('redis');
const config = require('../config/redis/default');

const redisClient = redis.createClient(config.port, config.host, config.option);
// 如果没有设置密码 是不需要这一步的
redisClient.auth(config.password);

redisClient.on('connect', () => {
    console.log('redis连接成功');
});

module.exports = redisClient;
