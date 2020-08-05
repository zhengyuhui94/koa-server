const reponseTool = {
    success(data = null, msg = '请求成功'){
        return {
            code: 0,
            data,
            msg
        };
    },
    fail(msg = '接口错误', code = 1){
        return {
            code,
            msg
        };
    }
};

module.exports = reponseTool;