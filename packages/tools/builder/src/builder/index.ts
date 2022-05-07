import React from 'react';
import posts from '@blog/posts';

// 独立组件
import * as katex from '@blog/mdx-katex';
// import * as tsCodeBlock from '@blog/mdx-code-block-typescript';

// 模板
import * as layout from '@blog/template-layout';
import * as post from '@blog/template-post';

const components = [katex];
const views = [layout, post];

export default async function build() {
  const assets = (
    await Promise.all(components.concat(views as any).map((item) => item.createAssets()))
  ).reduce((ans, item) => ans.concat(item), []);

  return assets;

  // console.log(assets.length);
  // debugger;
  // return React.createElement((posts[0] as any).Component);
}

// 流水线流程

// 1. 文章编译（这里会附带外置的组件）

// - 入口是文章
// - asset 全部忽略
// - 文章也可能自带资源（比如图片），这些是要收集的

// 2. 模板编译（这里会附带内置的组件）

// - 入口是模板
// - asset 全部忽略

// 3. 根据前面两次编译的上下文信息，生成静态资源

// - asset 全部拿出

// 4. 文章组件和模板组件组合生成完整页面
// 5. 组成完整网站
// 6. 其他静态资源

// 模板的话，每个模板是个入口，模板部分，每个模板都自带各种渲染函数，以及
// 文章的话，每个文章分别打包

// 文章和模板都只编译一次，在套用模板生成 post 页面之后，调用模板/组件内部的 getAsset 函数生成静态资源，此函数应该是异步的
// 要实现这个效果，组件/模板都只需要一个上下文，也就是说，只能运行一次，然后

// 模板还要加上内置组件，所以导出函数还要包含内置组件的静态资源

// jss、script 引用资源应该是比较随意的，然后它们公用同一个处理 asset 的函数
// script 文件作为 asset 文件的总入口，在模板文件中也需要处理 jss，但是这里不导出 css 文件

// 并不想把处理 asset 的中间产物暴露出去
// 所以这里只运行一次，拥有相同的上下文，那么，就需要将中间产物保存在包内部

// 这个问题不大

// 但是还有一个问题，文章到底要怎么才能自动拿到，自己到底用了哪些外置组件

// 因为组件的静态产物时后来生成的，所以可以在文章中，在使用组件中，导出组件的某个方法，这样来实现，自动的恐怕不行

// **这里的整个流程是**

// 先编译并创建文章组件
// 然后再去生成组件的静态资源
// 然后文章组件再去拿到静态资源的引用路径

// - 文章只需要拿到 script 和 css 的路径即可

// 文章在这过程中，要求屏蔽掉所有组件名称，那么唯一的方法就只能时在文章内手动导出方法了
// 因为每个组件的名称是固定的，那么这里也可以用自动引入

// 那么需要在每个组件中含有一个同样的方法：getAssetNames
// 具体分类的工作，就在编译中处理

// 模板和组件略有不同

// 那么，每个组件都需要三个部分——

// 1. 组件，这个可以有无限多个，给文章引用的
// 2. createAssets 创建静态资源函数，用于创建所有静态资源，返回所有资源路径和内容物，异步
// 3. getAssetNames 获取所有静态资源路径，一般需要在 createAssets 之后调用，如果是在这之前调用了，可能会不完全，同步

// 对于模板，只有上述的 1 和 2 两个部分，不需要第三个部分

// 这里还需要一个合并资源的函数，用于模板合并内置资源
// 合并之后，还需要另外进行最小化，这里还要另外处理（不一定）
