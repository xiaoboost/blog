import { expect, describe, it } from '@blog/test-toolkit';
import { compile } from '../parser';

function getCode(code: string, imports?: string) {
  return `
/*@jsxRuntime automatic @jsxImportSource react*/${imports ? `\n${imports}` : ''}
function _createMdxContent(props) {
  ${code}
}
function MDXContent(props = {}) {
  const { wrapper: MDXLayout } = props.components || {};
  return MDXLayout ? (
    <MDXLayout {...props}>
      <_createMdxContent {...props} />
    </MDXLayout>
  ) : (
    _createMdxContent(props)
  );
}
export default MDXContent;
`.trimStart();
}

describe('compile', () => {
  it('基础编译', async () => {
    expect(await compile('测试内容', true)).eq(
      getCode(
        `
  const _components = Object.assign(
    {
      p: "p",
    },
    props.components,
  );
  return <_components.p>{"测试内容"}</_components.p>;
    `.trim(),
      ),
    );
  });

  it('图片编译', async () => {
    expect(
      await compile(
        `
import img0 from "../images/img.jpg";

测试内容

![测试图片](\`\${img0}\`)
    `.trim(),
        true,
      ),
    ).eq(
      getCode(
        `
  const _components = Object.assign(
    {
      p: "p",
      img: "img",
    },
    props.components,
  );
  return (
    <>
      <_components.p>{"测试内容"}</_components.p>
      {"\\n"}
      <_components.p>
        <_components.img src={\`\${img0}\`} alt="测试图片" />
      </_components.p>
    </>
  );
    `.trim(),
        'import img0 from "../images/img.jpg";',
      ),
    );
  });

  it('组件内代码再附带 MD 格式文本', async () => {
    expect(
      await compile(
        `
import { TestBlock } from "@blog/components/test-block";

测试内容

<TestBlock>
测试文本\`code\`测试文本
文本**粗体**文本测试

> 引用文本

[链接文本](https://www.baidu.com)
</TestBlock>
    `.trim(),
        true,
      ),
    ).eq(
      getCode(
        `
  const _components = Object.assign(
    {
      p: "p",
      code: "code",
      strong: "strong",
      blockquote: "blockquote",
      a: "a",
    },
    props.components,
  );
  return (
    <>
      <_components.p>{"测试内容"}</_components.p>
      {"\\n"}
      <TestBlock>
        <_components.p>
          {"测试文本"}
          <_components.code>{"code"}</_components.code>
          {"测试文本\\n文本"}
          <_components.strong>{"粗体"}</_components.strong>
          {"文本测试"}
        </_components.p>
        <_components.blockquote>
          {"\\n"}
          <_components.p>{"引用文本"}</_components.p>
          {"\\n"}
        </_components.blockquote>
        <_components.p>
          <_components.a href="https://www.baidu.com">
            {"链接文本"}
          </_components.a>
        </_components.p>
      </TestBlock>
    </>
  );
    `.trim(),
        'import { TestBlock } from "@blog/components/test-block";',
      ),
    );
  });
});
