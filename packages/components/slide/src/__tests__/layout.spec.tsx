import { describe, expect, it } from '@blog/test-toolkit';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Box,
  Flex,
  Grid,
  Center,
  Place,
  PageLayout,
  Background,
} from '../layout';
import styles from '../layout/index.jss';

describe('布局的作者约定', () => {
  it('未传布局属性时使用 CSS 默认值，不重复生成内联样式', () => {
    for (const element of [
      <Box />,
      <Flex />,
      <Grid />,
      <Center />,
      <Place />,
      <PageLayout />,
      <Background src="/cover.svg" />,
    ]) {
      expect(renderToStaticMarkup(element)).not.include('style=');
    }
  });

  it('显式的 false、0 和布局属性仍然覆盖 CSS 默认值', () => {
    const flex = renderToStaticMarkup(
      <Flex
        direction="column"
        wrap={false}
        gap={0}
        align="start"
        justify="end"
        flex="content"
      />,
    );
    expect(flex).include('flex-direction:column').include('flex-wrap:nowrap').include('gap:0');
    expect(flex).include('align-items:flex-start').include('justify-content:flex-end').include('flex:0 1 auto');
    expect(renderToStaticMarkup(<Flex wrap />)).include('flex-wrap:wrap');

    const grid = renderToStaticMarkup(
      <Grid
        columns={1}
        gap={24}
        columnGap={0}
        align="center"
        justify="start"
      />,
    );
    expect(grid).include('grid-template-columns:repeat(1, minmax(0, 1fr))');
    expect(grid).include('column-gap:0').include('row-gap:24px').include('align-items:center').include('justify-items:start');

    const center = renderToStaticMarkup(<Center horizontal={false} vertical={false} />);
    expect(center).include('justify-content:flex-start').include('align-items:flex-start');
    expect(renderToStaticMarkup(<Background src="/cover.svg" fit="contain" />)).include('object-fit:contain');
  });

  it('保留 0，style 最后覆盖，盒子配置不泄漏到 DOM 属性', () => {
    const props = {
      className: 'custom-box',
      flex: 'fill' as const,
      radius: 12,
      padding: { horizontal: 0, vertical: 24 },
      border: { thickness: 0 },
      minWidth: 100,
      style: { minWidth: 200, borderRadius: 8 },
    };
    const html = renderToStaticMarkup(<Flex><Box {...props}>内容</Box></Flex>);
    expect(html).include(styles.classes.box).include('custom-box');
    expect(html).include('min-width:200px').include('min-height:0').include('flex:1 1 0px');
    expect(html).include('padding-left:0').include('padding-right:0').include('padding-top:24px');
    expect(html).include('border-radius:8px').include('border-width:0');
    expect(html).not.match(/\s(?:radius|flex|padding|border)=/);
    expect(html).not.match(/\sdata-slide-(?:flex|border|overflow|direction|align|justify|wrap)=/);
  });

  it('Place 的坐标保留 0 且不占用 transform，允许作者继续配置动画变换', () => {
    const html = renderToStaticMarkup(
      <Place
        x={0}
        y={0}
        width="100%"
        height="100%"
        style={{ transform: 'rotate(3deg)' }}
      >
        一层
      </Place>,
    );
    expect(html).include(styles.classes.place).include('left:0').include('top:0').include('transform:rotate(3deg)');
  });

  it('装饰背景不承载替代文字、不接管鼠标，作者可独立配置正文图片', () => {
    const html = renderToStaticMarkup(<Background src="/cover.svg" overlay="rgba(0,0,0,.2)" />);
    expect(html).include('aria-hidden="true"').include('alt=""');
    expect(html).include(styles.classes.background).include(styles.classes.backgroundImage);
  });
});
