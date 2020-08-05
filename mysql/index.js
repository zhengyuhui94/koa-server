const mysql = require('mysql');
const config = require('../config/mysql/default.js');

const pool = mysql.createPool({
    connectionLimit: 20,
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});

class Mysql {
    constructor(){
        this.pool = pool;
    }

    // 开启事务连接
    transactions(middleWare){
        return async (ctx, next) => {
            // 创建连接
            const connection = await this._getConnection();
            // 开启事务
            await this._beginTransaction(connection);
            // 捕获逻辑错误，进行相应的事务处理
            try{
                // 调用中间件回调函数，处理 sql 语句和逻辑
                await middleWare(ctx, next, connection);
                // 提交事务
                await this._commit(connection);
                // 释放连接
                connection.release();
            }catch(error){
                // 回滚事务
                await this._rollback(connection);
                // 释放连接
                connection.release();
                // 抛出错误，用户 logger 日志记录
                throw(error);
            }
        }
    }

    // 创建连接
    _getConnection(){
        return new Promise((resolve, reject) => {
            pool.getConnection((error, connection) => {
                if(error){
                    reject(error);
                }else{
                    resolve(connection);
                }
            });
        });
    }

    // 开启事务
    _beginTransaction(connection){
        return new Promise((resolve, reject) => {
            connection.beginTransaction(error => {
                if(error){
                    console.log('事务开启失败==========>');
                    reject(error);
                }else{
                    console.log('事务开启成功==========>');
                    resolve('事务开启成功');
                }
            });
        });
    }

    // 事务提交
    _commit(connection){
        return new Promise((resolve, reject) => {
            connection.commit((error) => {
                if(error){
                    console.log('事务提交失败');
                    reject(error);
                }else{
                    console.log('事务提交成功');
                    resolve('事务提交成功');
                }
            });
        });
    }
    
    // 事务回滚
    _rollback(connection){
        return new Promise((resolve, reject) => {
            connection.rollback(() => {
                console.log('插入失败，数据回滚');
                resolve('插入失败，数据回滚');
            });
        });
    }

    // 数据库查询方法
    // sql 查询语句
    query(sql, ctx, connection = pool){
        return new Promise((resolve, reject) => {
            connection.query(sql, (error, results, fields) => {
                if(error){
                    reject(error);
                }else{
                    resolve(results);
                }
            });
        });
    }

    // 插入数据
    insert(sql, ctx, connection = pool){
        return new Promise((resolve, reject) => {
            connection.query(sql, {}, (error, results) => {
                if(error){
                    reject(error);
                }else{
                    resolve(results);
                }
            });
        });
    }

    // 更新数据
    update(sql, ctx, connection = pool){
        return new Promise((resolve, reject) => {
            connection.query(sql, {}, (error, results) => {
                if(error){
                    reject(error);
                }else{
                    resolve(results);
                }
            });
        });
    }

    // 更新数据
    delete(sql, ctx, connection = pool){
        return new Promise((resolve, reject) => {
            connection.query(sql, (error, results) => {
                if(error){
                    reject(error);
                }else{
                    resolve(results);
                }
            });
        });
    }
}

module.exports = new Mysql();