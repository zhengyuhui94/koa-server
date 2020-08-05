// 混合 router 配置函数
const glob = require('glob');

const mixinRouter = () => {
    return new Promise((resolve, reject) => {
        glob('route/**/**.js', (error, files) => {
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

module.exports = mixinRouter;



