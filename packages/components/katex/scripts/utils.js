const path = require('path');

function resolve(...paths) {
  return path.join(__dirname, '..', ...paths);
}

exports.resolve = resolve;
exports.assetFile = resolve('dist/assets.js');
exports.templateFile = resolve('dist/index.js');
exports.packageData = require('../package.json');
