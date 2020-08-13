const redis = require('redis');
const config = require('../config/redis/default');

const redisClient = redis.createClient(config.port, config.host, config.option);
// 如果没有设置密码 是不需要这一步的
redisClient.auth(config.password);

redisClient.on('connect', () => {
    console.log('redis连接成功');
});

class Redis {
    get(key){
        return new Promise((resolve, reject) => {
            redisClient.get(key, (err, res) => {
                if(err){
                    reject(err);
                }else{
                    resolve(res);
                }
            });
        });
    }
    
    set(key, value, time){
        return new Promise((resolve, reject) => {
            redisClient.set(key, value, (err, res) => {
                if(err){
                    reject(err);
                }else{
                    // 设置存储数据的有效期
                    if(time){
                        redisClient.expire(key, time);
                    }
                    resolve(res);
                }
            });
        });
    }
};

module.exports = new Redis();
