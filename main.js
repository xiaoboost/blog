const //本地模块
    config = require('./lib/config'),
    post = require('./lib/article'),
    folder = require('./lib/folder'),
    deploy = require('./lib/deployer'),
    site = require('./create-site'),

    //公共模块
    fs = require('fs'),
    pug = require('pug'),
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
//生成css文件
function stylus2css(base) {
    const inputPath = './theme/css/',
        inputFile = 'style.styl',
        outputPath = (base + '/css/').normalize(),
        outputFile = 'style.css';

    //生成输出文件夹
    folder.createfs(outputPath);
    //生成css文件
    stylus(fs.readFileSync(inputPath + inputFile, 'utf8'))
        .include(inputPath)
        .set('compress', true)
        .use(autoprefixer())
        .render(function(err, css){
            if (err) throw err;
            fs.writeFileSync(outputPath + outputFile, css);
        });
}

//服务器模式
if (options[0] === 's' || options[0] === 'service') {
    const chokidar = require('chokidar'),
        express = require('express'),
        app = express(),
        _base = 'Z:/blog/',
        watchOpt = {
            ignored: /[\/\\]\./,
            persistent: true
        };

    //清空缓存
    folder.deletefs(_base);
    //生成文件
    html2file(_base);
    stylus2css(_base);
    copyFiles(_base);

    chokidar.watch('./theme/css/', watchOpt)
        .on('change', () => stylus2css(_base));
    chokidar.watch(['./theme/layout/', './_post/'], watchOpt)
        .on('change', () => html2file(_base));
    chokidar.watch('./theme/js/', watchOpt)
        .on('change', () => copyFiles(_base));

    //允许网页访问theme文件夹
    app.use(express.static(_base));
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
