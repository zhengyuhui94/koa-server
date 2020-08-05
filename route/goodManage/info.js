const Router = require('koa-router');
const excelExport = require('excel-export');

const router = new Router({
    prefix: '/goodManage/info'
});

// 添加商品
router.post('/add', async (ctx, next) => {
    const {adminId} = ctx.session;
    const {name, price, total, remark, statu, category_id, img, create_time} = ctx.request.body;
    await global.mysql.insert(`INSERT INTO good(name, price, total, remark, statu, category_id, admin_id, img, create_time) VALUES('${name}', ${price}, ${total}, '${remark}', ${statu}, ${category_id}, ${adminId}, '${img}', '${create_time}')`, ctx);
    ctx.body = global.responseTool.success(true, '添加成功');
    await next();
});

// 查询商品
router.post('/list', async (ctx, next) => {
    const {adminId} = ctx.session;
    const {currentPage, pageSize, statu, category_id, min_price, max_price, createTimeSort, priceSort} = ctx.request.body;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = currentPage * pageSize;
    // 拼接 mysql 条件查询语句
    let whereStr = `WHERE admin_id=${adminId}`;
    // 根据商品状态查询
    if(statu || statu === 0){
        whereStr = `${whereStr} AND statu=${statu}`;
    }
    // 根据商品类目查询
    if(category_id){
        whereStr = `${whereStr} AND category_id=${category_id}`;
    }
    // 根据价格区间查询
    if(min_price && max_price){
        whereStr = `${whereStr} AND price>=${min_price} AND price<=${max_price}`;
    }else if(min_price){
        whereStr = `${whereStr} AND price>=${min_price}`;
    }else if(max_price){
        whereStr = `${whereStr} AND price<=${max_price}`;
    }
    // 根据创建时间和价格排序，只使用一种排序方式，以升序为主，
    // 如果没有升序，默认以创建时间降序排序
    let orderStr = `ORDER BY create_time desc`;
    if(createTimeSort){
        orderStr = `ORDER BY create_time ${createTimeSort}`;
    }else if(priceSort){
        orderStr = `ORDER BY price ${priceSort}`;
    }
    // sql 查询
    const data = await global.mysql.query(`SELECT * FROM good ${whereStr} ${orderStr} LIMIT ${startIndex},${endIndex}`, ctx);
    const count = await global.mysql.query(`SELECT COUNT(*) as total FROM good ${whereStr}`);
    ctx.body = global.responseTool.success({
        data,
        total: count[0].total
    });
    await next();
});

// 更新商品状态
router.post('/changeStatu', async (ctx, next) => {
    const {id, statu} = ctx.request.body;
    await global.mysql.update(`UPDATE good SET statu=${statu} WHERE id=${id}`);
    ctx.body = global.responseTool.success(true, '状态更新成功');
    await next();
});

router.post('/del', async (ctx, next) => {
    const {ids} = ctx.request.body;
    const promiseArr = ids.map(id => {
        return global.mysql.update(`UPDATE good SET statu=1 WHERE id=${id}`);
    });
    await Promise.all(promiseArr).then(() => {
        ctx.body = global.responseTool.success(true, '删除成功');
    }).catch((err) => {
        console.log(err);
    });
    await next();
});

// 导出商品数据到 excel 
router.get('/exportExcel', async (ctx, next) => {
    const {adminId} = ctx.session;
    const data = await global.mysql.query(`SELECT * FROM good WHERE admin_id=${adminId}`, ctx);
    // 导出的 excel 配置
    let excelConf = {
        cols: [],
        rows: []
    };
    // 填充表头数据
    for(let key in data[0]){
        excelConf.cols.push({
            caption: key,
            type: typeof data[0][key],
            width: 260
        });
    }
    // 填充表格数据
    excelConf.rows = data.map(item => {
        return Object.values(item);
    });
    // 生成最终数据
    const result = excelExport.execute(excelConf);
    // 设置响应头
    // 响应的文件类型
    ctx.res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    // 指示响应的内容以何种形式展示，是页面展示【默认】，还是下载并保存到本地
    ctx.res.setHeader('Content-Disposition', 'attachment; filename=mall.xlsx');
    // 将数据转换为二进制
    let dataResult = Buffer.from(result, 'binary');
    // Buffer 类是 javascript 语言内置的 Uint8Array 类的子类
    // console.log(dataResult instanceof Uint8Array); // true
    ctx.body = dataResult;
    await next();
});

module.exports = router;