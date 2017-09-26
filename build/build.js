require('./check-versions')();
// 运行当前文件一定是生产环境
process.env.NODE_ENV = 'production';

const // 一个比较漂亮的loading界面
    ora = require('ora'),
    // node下的删除命令，效果类似于 "rm -rf"
    rm = require('rimraf'),
    // node下创建文件夹的命令，效果类似于 "mkdir -p"
    mkdirp = require('mkdirp'),
    path = require('path'),
    fs = require('fs'),
    chalk = require('chalk'),
    webpack = require('webpack'),
    utils = require('./utils'),
    config = require('../config'),
    gzip = require('zlib').createGzip,
    // 字体压缩任务
    fontMin = require('./font-min'),
    // 生成博客网站
    site = require('./create-site'),
    // 读取生产环境的配置
    webpackConfig = require('./webpack.prod.conf'),
    // 生成文件的进度条
    build = ora('building for production...'),
    // 输出文件路径
    output = path.join(config.build.assetsRoot, config.build.assetsSubDirectory);

// 构建进度条开始
build.start();
// 异步开始
let status = Promise.resolve();
// 生成本地文件
status = status.then(() => {
    // 删除成品文件夹中除[git文件夹]之外的所有东西
    const files = fs.readdirSync(output)
        .filter((file) => file !== '.git')
        .map((file) => new Promise((res) => rm(path.join(output, file), res)));

    return Promise.all(files);
}).then(() =>
    // 生成所有API文件
    Promise.all(Object.entries(site).map(([key, content]) => {
        const out = path.join(output, 'api', key);

        return new Promise((resolve, reject) => mkdirp(path.dirname(out), (err) => {
            if (err) { reject(err); }
            if (content.render instanceof Function) {
                content.render();
                delete content.markdown;
            }

            fs.writeFile(out, JSON.stringify(content), resolve);
        }));
    }))
).then(() =>
    // webpack打包网站
    new Promise((resolve, reject) =>
        webpack(webpackConfig, (err, stats) => {
            build.stop();
            if (err) { reject(err); }

            console.log(chalk.green('INFO: ') + '文件打包完成');
            resolve();
        })
    )
).then(() =>
    // 复制CNAME文件
    new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, '../CNAME'), (e, data) => {
            if (e) { reject(e); }

            fs.writeFile(path.join(output, 'CNAME'), data, resolve);
        });
    })
).then(() => {
    // 压缩中文字体
    const post = Object.keys(site)
            .filter((url) => site[url].hasOwnProperty('content'))
            .map((url) => (site[url].excerpt.join('') + site[url].content))
            .reduce((ans, text) => (ans + text), '').replace(/[\x00-\xff]/g, ''),

        text = Array.from(new Set(post)).join(''),
        out = path.join(output, './font/iosevka/'),
        font = path.resolve(__dirname, '../static/font/iosevka/inziu-iosevkaCC-SC-Regular.ttf');

    return fontMin(text, font, out);
}).then(() => {
    // 压缩图标字体
    const css = path.join(output, './css'),
        out = path.join(output, './font/icon/'),
        font = path.resolve(__dirname, '../static/font/icon/fontawesome.ttf'),
        // 提取所有图标
        text = fs.readdirSync(css).map((file) => path.join(css, file))
            .map((src) => fs.readFileSync(src).toString().match(/\\f[a-f0-9]{3}/ig))
            .reduce((ans, text) => ans.concat(text || []), [])
            .map((hex) => {
                let num = 0;
                hex = hex.slice(1).toLowerCase();
                Array.from(hex).forEach((n, i) =>
                    num += /[0-9]/.test(n)
                        ? n * (16 ** (3 - i))
                        : (n.charCodeAt() - 87) * (16 ** (3 - i)));

                return String.fromCodePoint(num);
            }).join('');

    return fontMin(text, font, out);
}).then(() => {
    // 字体压缩完毕之后空一行
    console.log('\n');

    // 若未开启Gzip则跳过
    if (!config.build.productionGzip) {
        return Promise.resolve();
    }
    // 压缩所有文本
    const exclude = [/\.git*/i, /\.(png|jpg|gif|woff|woff2)$/i],
        include = [/\.(css|js|html)$/i, /api/],
        files = utils.readFileAll(output)
            .filter((file) => exclude.some((reg) => !reg.test(file)))
            .filter((file) => include.some((reg) => reg.test(file)))
            .filter((file) => (fs.lstatSync(file).size > 1024));

    return Promise.all(files.map((file) =>
        new Promise((resolve) => {
            const input = fs.createReadStream(file);
            input.pipe(gzip({ level: 9 }))
                .pipe(fs.createWriteStream(file + '.gz'))
                .on('finish', () => (input.destroy(), resolve()));
        }))
    );
}).catch((e) => {
    // 错误捕获
    console.log(chalk.red('\n ERROR: ') + '构建发生错误，意外中止\n');
    console.error(chalk.red('\n 错误信息: ') + e);
});

// 对外暴露异步对象
module.exports = status;
