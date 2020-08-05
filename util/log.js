// 日志模块
const log4js = require('log4js');

// 日志记录管理配置
log4js.configure({
    appenders: {
        errorInfo: {
            type: 'file',
            // 文件名设置成时间字符串【2020-7-21】，达到日志一天生成一个文件的目的
            filename: `logs/${new Date().toLocaleDateString()}.log`
        }
    },
    categories: {
        default: {
            appenders: ['errorInfo'], 
            level: 'error' // 日志记录的错误级别
        }
    }
});
const logger = log4js.getLogger('errorInfo');

module.exports = logger;