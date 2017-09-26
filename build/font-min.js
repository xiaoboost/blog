const Fontmin = require('fontmin'),
    chalk = require('chalk');

// 配置字体压缩任务
function compressor(text, src, output) {
    return new Fontmin()
        .src(src)
        .use(Fontmin.glyph({
            text,
            hinting: false,
        }))
        .use(Fontmin.ttf2eot())
        .use(Fontmin.ttf2svg())
        .use(Fontmin.ttf2woff({
            deflate: true,
        }))
        .dest(output);
}

module.exports = function(text, src, output) {
    const task = compressor(text, src, output);

    return new Promise((resolve, reject) => {
        task.run((err, files) => {
            if (err) {
                reject(err);
            }

            console.log(`${chalk.green('INFO: ')}字体压制结束，共 ${chalk.red(text.length)} 个字符。`);
            resolve(files);
        });
    });
};
