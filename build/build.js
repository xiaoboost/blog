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
    config = require('../config'),
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
}).then(() => {
    // 生成所有API文件
    const files = [];
    for (const i in site) {
        const out = path.join(output, 'api', i);
        files.push(new Promise((res) => {
            mkdirp(path.dirname(out), (err) => {
                if (err) console.error(err);
                const content = site[i];
                // 渲染文章，并删除原文
                if (content.render instanceof Function) {
                    content.render();
                    delete content.markdown;
                }
                fs.writeFile(out, JSON.stringify(site[i]), res);
            });
        }));
    }

    return Promise.all(files);
}).then(() => {
    // webpack打包网站
    return new Promise((res, rej) => {
        webpack(webpackConfig, (err, stats) => {
            // 构建进度条结束
            build.stop();
            if (err) rej(err);
            console.log(chalk.cyan('  Build complete.\n'));

            res();
        });
    });
}).then(() => {
    // 复制CNAME文件
    return new Promise((res, rej) => {
        fs.readFile(path.join(__dirname, '../CNAME'), (e, data) => {
            if (e) rej(e);
            fs.writeFile(path.join(output, 'CNAME'), data, res);
        });
    });
});

// 错误捕获
status.catch((e) => {
    console.log(chalk.red('\n ERROR: ') + '构建发生错误，意外中止\n');
    console.error(chalk.red('\n 错误信息: ') + e);
});

// 对外暴露异步对象
module.exports = status;
