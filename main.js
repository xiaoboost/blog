require('shelljs/global');

const //本地模块
    config = require('./lib/config'),
    post = require('./lib/article'),
    deploy = require('./lib/deployer'),
    createSite = require('./lib/create-site'),

    //公共模块
    fs = require('fs'),
    path = require('path'),
    chalk = require('chalk'),
    stylus = require('stylus'),
    babel = require('babel-core'),
    uglify = require('uglify-js'),
    autoprefixer = require('autoprefixer-stylus'),

    //输入参数
    options = process.argv.splice(2);

//没有运行参数，直接退出
if (!options) {
    console.log(chalk.red('ERROR: ') + '需要输入参数');
    process.exit(1);
}

//压缩某文件夹的文件
function compressFolder(to, from) {
    const files = fs.readdirSync(from);

    for (let i = 0; i < files.length; i++) {
        const file = (from + '/' + files[i]).normalize(),
            fileTo = (to + '/' + files[i]).normalize();

        fs.writeFileSync(fileTo,
            uglify.minify(
                babel.transformFileSync(file, {presets: ['es2015']}).code,
                { fromString: true }
            ).code
        );
    }
}
//编译css文件
function stylus2css(output) {
    const base = path.join('./theme/', config.theme.css),
        file = path.join(base, 'main.styl'),
        out = path.normalize('/css/style.css');

    //生成css文件
    stylus(fs.readFileSync(file, 'utf8'))
        .include(base)
        .set('compress', true)
        .use(autoprefixer())
        .render((err, css) => {
            if (err) throw err;
            if (typeof output === 'object') {
                //输入为对象
                output.push({
                    path: out,
                    body: css,
                    lastModified: (new Date).toUTCString()
                });
            } else {
                //输入为路径
                //创建文件夹
                mkdir('-p', path.join(output, '/css/'));
                //创建css文件
                fs.writeFileSync(
                    path.join(output, out),
                    css
                );
            }
        });
}
//读取文件夹内文件
function read(arr, name) {
    //读取输入路径列表
    const files = fs.readdirSync(name);
    for (let i = 0; i < files.length; i++) {
        const now = path.join(name, files[i]);
        //检查当前路径是否是文件夹
        if (fs.lstatSync(now).isDirectory()) {
            read(arr, now);
        } else {
            arr.push({
                path: now,
                body: fs.readFileSync(now),
                lastModified: (new Date).toUTCString()
            });
        }
    }
}
//读取字体等文件
function fontImage(output) {
    const ans = [],
        font = path.join('./theme/', config.theme.font),
        image = path.join('./theme/', config.theme.img),
        postsImage = path.join(config.posts, 'img'),
        pathReg = /[/\\](font|img)[\d\D]+$/;

    //读取文件
    read(ans, font);
    read(ans, image);
    read(ans, postsImage);

    //修正路径
    ans.forEach((item) => item.path = item.path.match(pathReg)[0]);

    if (typeof output === 'string') {
        ans.forEach((item) => {
            const name = path.join(output, item.path);
            mkdir('-p', path.dirname(name));
            fs.writeFileSync(name, item.body);
        });
    } else {
        ans.forEach((n) => output.push(n));
    }
}

//服务器模式
if (options[0] === 's' || options[0] === 'service') {
    const chokidar = require('chokidar'),
        express = require('express'),
        ramMiddleware = require('./lib/ram-middleware'),
        app = express(),
        site = createSite(),
        watchOpt = {
            ignored: /[\/\\]\./,
            persistent: true
        };

    stylus2css(site);
    fontImage(site);

    debugger;

/*
    chokidar.watch('./theme/css/', watchOpt)
        .on('change', () => stylus2css(_base));
    chokidar.watch(['./theme/layout/', './_post/'], watchOpt)
        .on('change', () => html2file(_base));
    chokidar.watch('./theme/js/', watchOpt)
        .on('change', () => copyFiles(_base));
*/
    //挂载资源
    app.use(ramMiddleware(site));
    //建立虚拟网站，端口3000
    app.listen(3000, function() {
        console.info(chalk.green(' INFO: ') + '虚拟网站已建立于 http://localhost:3000/');
        console.info(chalk.green(' INFO: ') + 'CTRL + C 退出当前状态');
    });
}
//文件上传
if (options[0] === 'd' || options[0] === 'deploy') {
    const _base = './.deploy_git/',
        message = options[1] || (new Date()).toDateString();

    folder.deletefs(_base, ['.git']);
    copyFiles(_base, {compress: true});
    stylus2css(_base);
    html2file(_base);

    //上传文件
    deploy({ cwd: _base, encoding: 'utf8' }, message);
}
