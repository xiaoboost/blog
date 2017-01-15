const Transform = require('stream').Transform,
    setPrototypeOf = require('util').inherits,
    spawn = require('child_process').spawn,
    config = require('./config'),
    fs = require('fs'),
    chalk = require('chalk'),
    opt = { cwd: './.deploy_git/' };

//缓存类
function CacheStream() {
    Transform.call(this);
    this._cache = [];
}
CacheStream.prototype = {
    _transform(chunk, enc, callback) {
        const buf = chunk instanceof Buffer ? chunk : new Buffer(chunk, enc);

        this._cache.push(buf);
        this.push(buf);
        callback();
    },
    destroy() {
        this._cache.length = 0;
    },
    getCache(encoding) {
        //取出所有信息
        const buf = Buffer.concat(this._cache);
        this.destroy();

        if (!encoding) return buf;
        return buf.toString(encoding).trim();
    }
};
setPrototypeOf(CacheStream, Transform);

//git操作入口
function git() {
    const len = arguments.length,
        args = new Array(len);

    for (const i = 0; i < len; i++) {
        args[i] = arguments[i];
    }

    if (args[0] === 'init') {
        //初始化，配置参数
        args[1] = args[1] || {};
        for (const i in args[1]) {
            if (args[1].hasOwnProperty(i)) {
                opt[i] = args[1][i];
            }
        }
        //.git文件夹不存在，那么就需要初始化git
        if (!fs.existsSync((opt.cwd + '/.git').normalize())) {
            return promiseSpawn('git', ['init'], opt);
        } else {
            return new Promise((n) => n());
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
    const ans = message.replace(/files changed/, 'files ' + chalk.green('changed'))
        .replace(/ insertions\(\+\)/, ' ' + chalk.yellow('insertions(+)'))
        .replace(/ deletions\(-\)/,  ' ' + chalk.red('deletions(-)'))
        .replace(/\n create/g, '\n ' + chalk.green('create'))
        .replace(/\n rewrite/g, '\n ' + chalk.blue('rewrite'))
        .replace(/\n delete/g, '\n ' + chalk.red('delete'));

    console.log(ans);
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
//上传文件
function deploy(opt, message) {
    const url = config.deploy.repo,
        branch = config.deploy.branch;

    git('init', opt)
        .then(git('add', '-A'))
        .then(git('commit', '-m', message))
        .then(git('push', '-u', url, 'master:' + branch, '--force'))
        .then(() => console.log(chalk.green('\n INFO: ') + '文件上传完毕'))
        .catch((e) => console.log(chalk.red('\n ERROR: ') + '发生错误，意外中止\n' + e.code));
}

module.exports = deploy;
