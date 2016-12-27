# 博客生成器

自己用的博客生成器。

## 配置
所有的可修改的配置都在`/js/config.js`中，里面直接以对象直接量表示出来了。

## 主题
项目中使用`pug`模版引擎，css是使用`stylus`预处理器，它们的路径都可以在配置中的`theme`参数下修改。  
js分为两部分，`lib`中放置使用的库，这里的文件将不会做任何处理直接添加至页面；`cus`中放置的是自己写的程序，允许使用ES6，最后将会统一用babel转换为ES5，并使用`uglify-js`压缩，它们将会放在页面的最后。

## markdown
markdown解析器修改自[marked](https://github.com/chjj/marked)开源项目。  
我删除了一些我觉得很繁琐的规则，添加了一些我自己常用的“方言”，并修改了部分格式的规则。  

### 区块元素
* 空行 newline  
  多个空格将会变成一个空行
* 正文 paragraph  
  前后空格或者是非区块元素
* 分割线 hr  
  单独一行并且是三个及以上的`-`或者`=`符号
* 区块引用 blockquote  
  以`> `符号开始，以最后空一行结束
* 列表 list  
  星号、加号和减号是无序列表标记，数字是有序列表标记，新行退三格表示下级列表
* 表格 table  
  必须有首行以及表示表格元素对齐格式的第二行
* 标题 heading  
  1-6个`#`号表示标题等级，`#`号之后必须空格
* 网页元素 html   
  兼容网页标签，标签内的元素默认不会进行渲染
* 代码 code  
  被 ``` 符号前后包围，这个符号必须独立成行，开头可以指定语言
  
### 区段元素
* 块级公式 mathblock  
  被`$$`符号前后包围，这个符号必须独立成行
* 行内公式 mathinline  
  被`$$`符号前后包围，这个符号和公式在都同一行中，公式必须只有一行
* 行内链接 link  
  只允许行内式链接，即`[title](http://……)`
* 图片 image  
  只允许行内式，即`![title](href)`
* 裸露链接 url  
  直接以 http\://text 这种形式出现的链接
* 下标 sub  
  被单独一个下划线包围起来的文字，形如`_text_`
* 上标 sup  
  被单独的上角标包围起来的文字，形如`^text^`
* 斜体 em  
  被单独的星号包围的文字，形如`*text*`
* 粗体 bold  
  被两个星号包围的文字，形如`**text**`
* 行内代码 codespan  
  被 \` 符号包围的文字，形如 \`text\`
* 删除线 del  
  被`~~`包围的文字
* 文本 txt  
  什么格式都没有的普通文本

### 注意
1. 想要在文档中显示上述特殊符号，需要使用反斜杠转义 "\"，比如，想在行内代码中使用含有下划线的变量，就需要这样 `\_a\_`；而且，当你把本脚本当作是网页脚本去渲染字符串时，那么就需要两个反斜杠转义 `\\_a\\_`。  
2. link和image两个元素的title允许存在上下标，并且传入renderer的参数都会被转义。  
3. 除开特别说明了的，特殊字符默认都未被转义，具体来说是这几个字符: & < > " '。  
4. 在区段元素中，mathblock、mathinline、sub、sup、text内部不会再继续进行行内渲染，而其余元素内部将会继续（递归）。  

## 许可
MIT License