// 混合 router 配置函数
const glob = require('glob');

const mixinMiddleware = () => {
    return new Promise((resolve, reject) => {
        glob('middleware/**/**.js', (error, files) => {
            if(error){
                console.log(error);
            }else{
                // 混合 router 配置
                const routers = files.map(file => {
                    return require(`../${file}`);
                })
                resolve(routers);
            }
        });
    });
};

module.exports = mixinMiddleware;



