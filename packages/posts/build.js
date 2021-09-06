const Glob = require('fast-glob');
const path = require('path');
const fs = require('fs');
const { build: esbuild } = require('esbuild');
const { isDevelopment, mergeBuild } = require('@blog/utils');
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

async function writeTypeFile() {
  const outFile = path.join(outDir, 'index.d.ts');
  await fs.promises.mkdir(path.dirname(outFile), { recursive: true });
  await fs.promises.writeFile(outFile, `
import { PostRendered } from '@blog/esbuild-loader-mdx';
const posts: PostRendered[];
export default posts;
export type * from '@blog/esbuild-loader-mdx';
  `.trim());
}

async function build() {
  await writeTypeFile();

  const inputCode = await getInputCode();

  esbuild(mergeBuild({
    minify: false,
    watch: isDevelopment,
    publicPath: '/',
    mainFields: ['source', 'source', 'main'],
    assetNames: '/assets/[name].[hash]',
    outfile: path.join(outDir, 'index.js'),
    external: ['react', '@mdx-js/react'],
    stdin: {
      contents: inputCode,
      resolveDir: __dirname,
      sourcefile: path.join(__dirname, 'v-input.js'),
      loader: 'js',
    },
    plugins: [
      MdxLoader(),
    ],
  }))
  .catch((e) => {
    console.warn(e);
  })
}

build();
