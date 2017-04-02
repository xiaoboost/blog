const Fontmin = require('fontmin'),
    chalk = require('chalk');

// 配置字体压缩任务
function compressor(text) {
    return new Fontmin()
        .src('./static/font/inziu-iosevka/inziu-iosevkaCC-SC-Regular.ttf')
        .use(Fontmin.glyph({
            text,
            hinting: false
        }))
        .use(Fontmin.ttf2eot())
        .use(Fontmin.ttf2svg())
        .use(Fontmin.ttf2woff({
            deflate: true
        }))
        .dest('./fonts/');
}

module.exports = function(text) {
    const fontSet = text.reduce((set, text) => new Set([...set, ...text]), new Set()),
        task = compressor(Array.from(fontSet).join('').replace(/[\x00-\xff]/g, ''));

    debugger;

    return new Promise((resolve, reject) => {
        task.run((err, files) => {
            if (err) {
                reject(err);
            }

            console.log(chalk.green('INFO: ') + '字体压制结束');
            resolve();
        });
    });
};
