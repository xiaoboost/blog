const { load } = require('@blog/server');
const { runScript } = require('@blog/utils');
const { resolve, templateFile } = require('./utils');
const { promises: fs } = require('fs');

load(resolve('dist'), () => {
  return [
    '<div>Hello World</div>',
  ];
});
