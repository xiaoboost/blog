const path = require('path');
const { mochaOptions } = require('@blog/tests');

module.exports = {
  ...mochaOptions,
  spec: [path.join(__dirname, 'src/__tests__/*.{spec,test}.*')],
};
