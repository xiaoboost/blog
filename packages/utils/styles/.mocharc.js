const path = require('path');
const { mochaOptions } = require('@blog/test-toolkit/setup');

module.exports = {
  ...mochaOptions,
  spec: [path.join(__dirname, 'src/**/*/__tests__/*.{spec,test}.*')],
};
