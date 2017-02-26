const u = undefined,
    //本地模块
    config = require('./lib/config'),
    post = require('./lib/article'),
    deploy = require('./lib/deployer'),
    createSite = require('./lib/create-site'),
    fs = require('./lib/file-system'),
    //公共模块
    fsm =  new (require('memory-fs'))(),
    path = require('path'),
    chalk = require('chalk'),
    stylus = require('stylus'),
    webpack = require('webpack'),
    autoprefixer = require('autoprefixer-stylus'),

    //输入参数
    options = process.argv.splice(2);

//没有运行参数，直接退出
if (!options) {
    console.log(chalk.red('ERROR: ') + '需要输入参数');
    process.exit(1);
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
//压缩某文件夹的文件
//webpack是异步的，所以该函数也只能是异步的
function packJs(outBase, os) {
    const filename = 'script.min.js',
        compiler = webpack({
            entry: path.join(__dirname, '/theme/', config.theme.js, 'main.js'),
            output: {
                path: path.join(outBase, 'js'),
                filename
            },
            module: {
                rules: [
                    {
                        test: /\.js$/,
                        exclude: /node_modules/,
                        loader: 'babel-loader',
                        options: {
                            presets: [ ['es2015', { modules: false }] ],
                            plugins: ['transform-runtime']
                        }
                    }
                ]
            },
            plugins: (os === fsm)
                ? []
                : [new webpack.optimize.UglifyJsPlugin({minimize: true})]
        });

    //输出至内存
    if (os === fsm) {
        compiler.outputFileSystem = fsm;
    }
    //异步编译
    return (new Promise((res) => {
        compiler.run((err, stats) => {
            //错误输出
            if (stats.hasErrors()) {
                console.log(stats.toString({ colors: true }));
            }
            //异步过程结束
            res();
        });
    }));
}
//编译css文件
function stylus2css(outBase, os) {
    const base = path.join('./theme/', config.theme.css),
        file = path.join(base, 'main.styl'),
        output = path.join(outBase, '/css/style.css');

    //生成css文件
    stylus(fs.readFileSync(file, 'utf8'))
        .include(base)
        .set('compress', true)
        .use(autoprefixer())
        .render((err, css) => {
            if (err) throw err;
            //写入文件
            fs.writeFileSync(output, css, os);
        });
}
//读取字体等文件
function fontImage(outBase, os) {
    const ans = [],
        font = path.join('./theme/', config.theme.font),
        image = path.join('./theme/', config.theme.img),
        postsImage = path.join(config.posts, 'img'),
        pathReg = /[/\\](font|img)[\d\D]+$/;

    //读取文件
    read(ans, font);
    read(ans, image);
    read(ans, postsImage);

    //修正路径，并写入文件系统
    ans.forEach((item) => fs.writeFileSync(
        path.join(outBase, item.path.match(pathReg)[0]),
        item.body, os
    ));
}

//服务器模式
if (options[0] === 's' || options[0] === 'service') {
    const chokidar = require('chokidar'),
        express = require('express'),
        ramMiddleware = require('./lib/ram-middleware'),
        _output = __dirname,
        app = express(),
        watchOpt = {
            ignored: /[\/\\]\./,
            persistent: true
        };

    createSite(_output, fsm);
    stylus2css(_output, fsm);
    fontImage(_output, fsm);
    packJs(_output, fsm)
        //建立虚拟网站，端口3000
        .then(() => app.listen(3000, () => {
            console.log(chalk.green(' INFO: ') + '虚拟网站已建立于 http://localhost:3000/');
            console.log(chalk.green(' INFO: ') + 'CTRL + C 退出当前状态');
        }));

    //挂载资源
    app.use(ramMiddleware(_output, fsm));
    //文件监控
    chokidar.watch('./theme/css/', watchOpt)
        .on('change', () => stylus2css(_output, fsm));
    chokidar.watch(['./theme/layout/', './_post/'], watchOpt)
        .on('change', () => createSite(_output, fsm));
    chokidar.watch('./theme/js/', watchOpt)
        .on('change', () => packJs(_output, fsm));
}
//生成文件
if (options[0] === 'g' || options[0] === 'generate') {
    const _output = options[1]
        ? path.join(__dirname, options[1])
        : path.join(__dirname, 'public');

    console.log(chalk.green(' INFO: ') + '开始编译文件……');

    createSite(_output, fs);
    stylus2css(_output, fs);
    fontImage(_output, fs);
    packJs(_output, fs)
        .then(() => console.log(chalk.green(' INFO: ') + '文件编译完成！'));
}
//文件上传
if (options[0] === 'd' || options[0] === 'deploy') {
    const message = options[1] || (new Date()).toDateString(),
        _output = path.join(__dirname, '.deploy_git');

    createSite(_output, fs);
    stylus2css(_output, fs);
    fontImage(_output, fs);
    packJs(_output, fs)
        //上传文件
        .then(() => deploy({ cwd: _output, encoding: 'utf8' }, message));
}
