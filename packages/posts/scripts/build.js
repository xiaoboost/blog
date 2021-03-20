const Glob = require('fast-glob');
const path = require('path');
const { promises: fs } = require('fs');

Glob('./posts/**/*.md')
  .then((files) => {
    let importStr = '';
    let exportStr = '';

    for (let i = 0; i < files.length; i++) {
      importStr += `import post${i} from '${files[i]}';\n`;
      exportStr += `  post${i},\n`;
    }

    return `${importStr}\nexport default [\n${exportStr}];\n`;
  })
  .then((content) => {
    return fs.writeFile(path.join(__dirname, '../index.js'), content);
  });
