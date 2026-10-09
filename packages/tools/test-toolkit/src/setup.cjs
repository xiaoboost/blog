// Mocha 读取配置时还没有注册 TS 加载器，需要先加载 tsx。
require('tsx');
module.exports = require('./mocha.ts');
