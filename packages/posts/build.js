const Glob = require('fast-glob');
const path = require('path');
const fs = require('fs');
const { build: esbuild } = require('esbuild');
const { isDevelopment } = require('@blog/utils');
const { MdxLoader } = require('@blog/esbuild-loader-mdx');

const outDir = path.join(__dirname, './dist');

async function getInputCode() {
  const posts = await Glob(path.join(__dirname, 'data/**/*.md').replace(/\\/g, '/'));

  let code = '';

  for (let i = 0; i < posts.length; i++) {
    code += `import a${i} from '${posts[i]}';\n`;
  }

  code += `\nconst posts = [
    ${Array(posts.length).fill(0).map((_, i) => `a${i}`).join(', ')}
  ]
    .sort((pre, next) => pre.create > next.create ? -1 : 1);

  export default posts;
  `;

  return code;
}

function writeTypeFile() {
  return fs.promises.writeFile(path.join(outDir, 'index.d.ts'), `
  import { PostData } from '@blog/esbuild-loader-mdx';
  const posts: PostData[];
  export default posts;
  export * from '@blog/esbuild-loader-mdx';
  `.trim());
}

async function build() {
  await writeTypeFile();

  const inputCode = await getInputCode();

  esbuild({
    bundle: true,
    write: true,
    format: 'cjs',
    logLevel: 'info',
    minify: !isDevelopment,
    watch: isDevelopment,
    mainFields: ['source', 'source', 'main'],
    assetNames: '/assets/[name].[hash]',
    publicPath: '/',
    outfile: path.join(outDir, 'index.js'),
    stdin: {
      contents: inputCode,
      resolveDir: __dirname,
      sourcefile: path.join(__dirname, 'v-input.js'),
      loader: 'js',
    },
    plugins: [
      MdxLoader(),
    ],
  })
  .catch((e) => {
    console.warn(e);
  })
}

build();
