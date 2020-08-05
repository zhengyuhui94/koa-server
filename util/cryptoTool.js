const crypto = require('crypto');

// 加密方法
const cryptoTool = {
    hash(str){
        const md5 = crypto.createHash('md5');
        str = md5.update(str).digest('hex');
        return str;
    }
};

module.exports = cryptoTool;