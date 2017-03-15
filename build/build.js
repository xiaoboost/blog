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
    spinner = ora('building for production...'),
    // 输出文件路径
    output = path.join(config.build.assetsRoot, config.build.assetsSubDirectory);

spinner.start();
rm(output, (err) => {
    if (err) throw err;
    webpack(webpackConfig, (err, stats) => {
        spinner.stop();
        if (err) throw err;
        process.stdout.write(stats.toString({
            colors: true,
            modules: false,
            children: false,
            chunks: false,
            chunkModules: false
        }) + '\n\n');

        for (const i in site) {
            const out = path.join(output, 'api', i);
            mkdirp(path.dirname(out), (err) => {
                if (err) console.error(err);
                fs.writeFileSync(out, JSON.stringify(site[i]));
            });
        }

        console.log(chalk.cyan('  Build complete.\n'));
        console.log(chalk.yellow(
            '  Tip: built files are meant to be served over an HTTP server.\n' +
            '  Opening index.html over file:// won\'t work.\n'
        ));
    });
});
