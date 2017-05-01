const Transform = require('stream').Transform,
    spawn = require('child_process').spawn,
    path = require('path'),
    fs = require('fs'),
    chalk = require('chalk'),
    config = require('../config'),
    // 生成静态文件之后的异步对象
    build = require('./build'),
    // 上传设定
    url = require('../config/site').deploy.url,
    branch = require('../config/site').deploy.branch,
    // 输入参数，默认为上传时间
    message = process.argv[2] || (new Date()).toLocaleString(),
    // 默认文件夹
    opt = { cwd: path.join(config.build.assetsRoot, config.build.assetsSubDirectory) };

//缓存类
class CacheStream extends Transform {
    constructor() {
        super();
        this._cache = [];
    }

    _transform(chunk, enc, callback) {
        const buf = chunk instanceof Buffer
            ? chunk
            : new Buffer(chunk, enc);

        this._cache.push(buf);
        this.push(buf);
        callback();
    }
    destroy() {
        this._cache.length = 0;
    }
    getCache(encoding) {
        //取出所有信息
        const buf = Buffer.concat(this._cache);
        this.destroy();

        if (!encoding) return buf;
        return buf.toString(encoding).trim();
    }
}
//git操作入口
function git(...args) {
    if (args[0] === 'init') {
        //初始化，配置参数
        Object.assign(opt, args[1] || {});
        //.git文件夹不存在，那么就需要初始化git
        if (!fs.existsSync(path.join(opt.cwd, '.git'))) {
            return promiseSpawn('git', ['init'], opt);
        } else {
            return Promise.resolve();
        }
    } else {
        //子进程运行git命令
        return (() => promiseSpawn('git', args, opt));
    }
}
//子进程信息的字体渲染
function log(message) {
    if (!message) {
        return;
    }

    console.log(
        message
            .replace(/ changed,?/, chalk.green(' changed') + ',')
            .replace(/( insertions?\(\+\))/, chalk.yellow('$1'))
            .replace(/( deletions?\(-\))/, chalk.red('$1'))
            .replace(/\n create/g, chalk.green('\n create'))
            .replace(/\n rewrite/g, chalk.blue('\n rewrite'))
            .replace(/\n delete/g, chalk.red('\n delete'))
            .replace(/\n rename/g, chalk.cyan('\n rename'))
    );
}
//异步子进程
function promiseSpawn(command, args, options) {
    if (!command) {
        throw new TypeError('command is required!');
    }

    if (!options && args && !Array.isArray(args)) {
        options = args;
        args = [];
    }

    args = args || [];
    options = options || {};

    return new Promise(function(resolve, reject) {
        const stdoutCache = new CacheStream(),
            stderrCache = new CacheStream(),
            task = spawn(command, args, options),
            encoding = options.hasOwnProperty('encoding')
                ? options.encoding
                : 'utf8';

        //流管道连接
        task.stdout.pipe(stdoutCache);
        task.stderr.pipe(stderrCache);

        //子进程结束
        task.on('close', function() {
            log(stdoutCache.getCache(encoding));
            resolve();
        });
        //子进程发生错误
        task.on('error', function(code) {
            const e = new Error(stderrCache.getCache(encoding));
            e.code = code;
            reject(e);
        });
    });
}

// 上传文件
build
    .then(git('init', opt))
    .then(git('add', '-A'))
    .then(git('commit', '-m', message))
    .then(git('push', '-u', url, 'master:' + branch, '--force'))
    .then(() => console.log(chalk.green('\nINFO: ') + '文件上传完毕'))
    // 错误捕获
    .catch((e) => {
        console.log(chalk.red('\nERROR: ') + '上传发生错误，意外中止\n');
        console.error(chalk.red('\n 错误信息: ') + e);
    });

