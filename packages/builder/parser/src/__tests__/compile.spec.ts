import { expect, describe, it } from '@blog/test-toolkit';
import { compile } from '../parser';

function getCode(code: string, imports?: string) {
  return `
/*@jsxRuntime automatic @jsxImportSource react*/${imports ? `\n${imports}` : ''}
function _createMdxContent(props) {
  ${code}
}
function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
}
export default MDXContent;
`.trimStart();
}

describe('compile', () => {
  it('basic', async () => {
    expect(await compile('测试内容')).eq(
      getCode(
        `
  const _components = Object.assign({
    p: "p"
  }, props.components);
  return <_components.p>{"测试内容"}</_components.p>;
    `.trim(),
      ),
    );
  });

  it('image', async () => {
    expect(
      await compile(
        `
import img0 from '../images/img.jpg';

测试内容

![测试图片](\`\${img0}\`)
    `.trim(),
      ),
    ).eq(
      getCode(
        `
  const _components = Object.assign({
    p: "p",
    img: "img"
  }, props.components);
  return <><_components.p>{"测试内容"}</_components.p>{"\\n"}<_components.p><_components.img src=\`\${img0}\` alt="测试图片" /></_components.p></>;
    `.trim(),
        "import img0 from '../images/img.jpg';",
      ),
    );
  });
});
