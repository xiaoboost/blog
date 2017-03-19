const marked = require('./marked'),
    katex = require('katex'),
    highlight = require('highlight\.js');

//markdwon自定义渲染器
const renderer = marked.setRender = new marked.Renderer();

//段落正文渲染
renderer.paragraph = function(text) {
    const  space = /<[\d\D]+? class='(katex-display|img-block)'/;

    return (
        '<p>' +
        text.trim().split('\n').map(function(n){
            if (n.search(space) !== -1) {
                //子元素是整行格式，那么当前span行就不能有前置空格，添加space类
                return (`<span class="space">${n}</span>`);
            } else {
                return (`<span>${n}</span>`);
            }
        }).join('\n')
        + '</p>\n'
    );
};
//html渲染
renderer.html = function(html) {
    const open = /<[\d\D]+?>/,
        close = '<\/p>';
    let tagOpen = '', content = '';

    //<p>标签和段落正文使用同样的渲染
    if (html.indexOf(close) !== -1) {
        //提取开标签
        tagOpen = open.exec(html);
        //渲染正文
        content = marked(html.replace(open, '').replace(close, '')).trim();
        return (tagOpen[0] + content.slice(3));
    }

    return (html);
};
//code渲染
renderer.code = function(code, lang) {
    //按行切割代码
    const lan = lang ? lang.toLowerCase() : '',
        text = lan
            ? highlight.highlight(lan, code)
            : highlight.highlightAuto(code),
        // 代码本体
        content = text.value.trim().split('\n')
            .map((n) => (`<li>${n}<\/li>`)),
        //代码行号
        list = new Array(content.length).fill(0)
            .map((n, i) => (`<li>${(i + 1)}</li>`));

    return (
        `<pre class="${lan}">` +
            '<code>' +
                `<ul class="gutter">${list.join('')}</ul>` +
                `<ul class="code">${content.join('')}</ul>` +
            '</code>' +
        '</pre>'
    );
};
//图片渲染
renderer.image = function(href, title, text) {
    const spantitle = (title ? title : text).unescape(),
        tagtitle = spantitle.clearTag();

    return (
        `<img class="img-block" src="${href}" alt="${tagtitle}" title="${tagtitle}">` +
        `<span class="img-title">${spantitle}</span>`
    );
};
//行内公式
renderer.mathinline = function(math) {
    return (katex.renderToString(math));
};
//块级公式
renderer.mathblock = function(math) {
    //块级公式必须单独成一行，所以后面需要加上换行符
    return (katex.renderToString(math, { displayMode: true }) + '\n');
};
//上标
renderer.sup = function(text) {
    if (text === '注') {
        return `<sup class="label">${text}</sup>`;
    } else {
        return `<sup>${text}</sup>`;
    }
};

module.exports = marked;
