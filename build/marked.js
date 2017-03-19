/**
 * 自用的markdown解析器，修改自开源项目：marked（https://github.com/chjj/marked）
 * 自己改编的主要原因是我想使用一些自定义的格式，如果不动源代码的话实在是太难以实现了
 *
 * 下面是我自己使用的markdown规则——
 *
 * 区块元素：
 *     newline      | 空行       | 多个空格将会变成一个空行
 *     paragraph    | 正文       | 前后空格或者是非大段正文元素，此元素将会被<p>标签包裹
 *     hr           | 分割线     | 单独一行并且是三个及以上的 "-" 或者 "=" 符号
 *     blockquote   | 区块引用   | 以 "> "符号开始，以最后空一行结束
 *     list         | 列表       | 星号、加号或是减号是无序列表标记，数字是有序列表标记，新行退三格表示下级列表
 *     table        | 表格       | 必须有首行以及表示表格元素对齐格式的第二行
 *     heading      | 标题       | 1-6个"#"号表示标题等级，#号之后必须空格
 *     html         | 网页元素    | 兼容网页标签，标签内的元素默认不会进行渲染
 *     code         | 代码       | 被 "```"符号前后包围，这个符号必须独立成行，开头可以指定语言
 *
 * 区段元素：
 *     mathblock    | 块级公式    | 被"$$"符号前后包围，这个符号必须独立成行
 *     mathinline   | 行内公式    | 被"$$"符号前后包围，这个符号和公式在都同一行中，公式必须只有一行
 *     link         | 行内链接    | 只允许行内式链接，即[title](http://……)这样的形式
 *     image        | 图片       | 只允许行内式，形如 ![title](href)
 *     url          | 裸露链接    | 直接以 http://text 这种形式出现的链接
 *     sub          | 下标       | 被单独一个下划线包围起来的文字，形如 _text_
 *     sup          | 上标       | 被单独的上角标包围起来的文字，形如 ^text^
 *     em           | 斜体       | 被单独的星号包围的文字，形如 *text*
 *     bold         | 粗体       | 被两个星号包围的文字，形如 **text**
 *     codespan     | 行内代码    | 被 "`"包围的文字，形如 `text`
 *     del          | 删除线     | 被"~~"包围的文字，形如 ~~text~~
 *     txt          | 文本       | 什么格式都没有的普通文本
 *
 * 注：1. 想要在文档中显示上述特殊符号，需要使用反斜杠转义 "\"
 *       比如，想在行内代码中使用含有下划线的变量，就需要这样 `\_a\_`
 *       但是，当你把本脚本当作是网页脚本去渲染字符串时，那么就需要两个反斜杠转义 `\\_a\\_`
 *    2. 在区段元素中，mathblock、mathinline、sub、sup、codespan、text内部不会再继续进行行内渲染，而其余元素内部将会继续（递归）
 *    3. 两个数学公式元素的默认渲染器不会对内容做任何处理，需要单独引用外部渲染器
 *    4. 特殊字符（& < > " '）默认将会全部被转义，但是有两种例外情况：
 *       1. 数学公式元素不会对内容做任何处理
 *       2. em、bold、txt以及image和link的title部分，它们将会保留上下标（<sub>、<sup>）
 */

(function() {
    //正则扩展
    function replace(regex, opt) {
        regex = regex.source;
        opt = opt || '';
        return function self(name, val) {
            if (!name) return new RegExp(regex, opt);
            val = val.source || val;
            val = val.replace(/(^|[^\[])\^/g, '$1');
            regex = regex.replace(name, val);
            return self;
        };
    }
    //特殊字符转义
    function escape(html) {
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    //排除上下标的特殊字符转义
    function escapeEx(html) {
        return escape(html)
            .replace(/&lt;(\/?sub)&gt;/g, '<$1>')
            .replace(/&lt;(\/?sup)&gt;/g, '<$1>');
    }

    //渲染器定义
    function Renderer() {}
    Renderer.prototype = {
        //下面是区块元素的渲染
        //代码块
        code(code, lang) {
            if (!lang) {
                return '<pre><code>'
                    + code
                    + '\n</code></pre>';
            }

            return '<pre><code class="'
                + escape(lang, true)
                + '">'
                + escape(code)
                + '\n</code></pre>\n';
        },
        //区块引用
        blockquote(quote) {
            return '<blockquote>\n' + quote + '</blockquote>\n';
        },
        //html文本
        html(html) {
            return html;
        },
        //标题
        heading(text, level) {
            return '<h' + level + '>'
                + text
                + '</h' + level + '>\n';
        },
        //分割线
        hr() {
            return '<hr>\n';
        },
        //列表
        list(body, ordered) {
            const type = ordered ? 'ol' : 'ul';
            return '<' + type + '>\n' + body + '</' + type + '>\n';
        },
        //列表元素
        listitem(text) {
            return '<li>' + text + '</li>\n';
        },
        //段落正文
        paragraph(text) {
            return '<p>' + text + '</p>\n';
        },
        //表格
        table(header, body) {
            return '<table>\n'
                + '<thead>\n'
                + header
                + '</thead>\n'
                + '<tbody>\n'
                + body
                + '</tbody>\n'
                + '</table>\n';
        },
        //表格行
        tablerow(content) {
            return '<tr>\n' + content + '</tr>\n';
        },
        //表格元素
        tablecell(content, flags) {
            const type = flags.header ? 'th' : 'td',
                tag = flags.align
                    ? '<' + type + ' style="text-align:' + flags.align + '">'
                    : '<' + type + '>';
            return tag + content + '</' + type + '>\n';
        },

        //下面是区段元素的渲染
        //行内公式
        mathinline(math) {
            return ('<span>' + math + '</span>');
        },
        //块级公式
        mathblock(math) {
            return ('<p>' + math + '</p>\n');
        },
        //粗体
        strong(text) {
            return '<strong>' + text + '</strong>';
        },
        //下标
        sub(text) {
            return '<sub>' + text + '</sub>';
        },
        //上标
        sup(text) {
            return '<sup>' + text + '</sup>';
        },
        //斜体
        em(text) {
            return '<em>' + text + '</em>';
        },
        //行内代码
        codespan(text) {
            return '<code>' + text + '</code>';
        },
        //空行
        br() {
            return '<br>';
        },
        //删除线
        del(text) {
            return '<del>' + text + '</del>';
        },
        //链接
        link(href, title, text) {
            let out = '<a href="' + href + '"';
            if (title) {
                out += ' title="' + title + '"';
            }
            out += '>' + text + '</a>';
            return out;
        },
        //图片
        image(href, title, text) {
            let out = '<img src="' + href + '" alt="' + text + '"';
            if (title) {
                out += ' title="' + title + '"';
            }
            out += '>';
            return out;
        },
        //文本
        text(text) {
            return text;
        }
    };
    //区块元素规则
    const block = function() {
        const ans = {
            newline: /^\n+/,
            code: /^ *(`{3,}|~{3,})[ .]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/,
            hr: /^( *[-*_]){3,} *(?:\n+|$)/,
            heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
            blockquote: /^( *>[^\n]+(\n[^\n]+)*\n*)+/,
            list: /^( *)(bull) [\s\S]+?(?:hr|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
            html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
            table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/,
            paragraph: /^((?:[^\n]+\n?(?!code|list|hr|heading|blockquote|tag))+)\n*/,
            text: /^[^\n]+/
        };

        ans.bullet = /(?:[*+-]|\d+\.)/;
        ans.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
        ans.item = replace(ans.item, 'gm')
            (/bull/g, ans.bullet)
            ();

        ans.list = replace(ans.list)
            (/bull/g, ans.bullet)
            ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
            ();

        ans._tag = '(?!(?:'
            + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
            + '|let|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
            + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

        ans.html = replace(ans.html)
            ('comment', /<!--[\s\S]*?-->/)
            ('closed', /<(tag)[\s\S]+?<\/\1>/)
            ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
            (/tag/g, ans._tag)
            ();

        ans.paragraph = replace(ans.paragraph)
            ('hr', ans.hr)
            ('heading', ans.heading)
            ('blockquote', ans.blockquote)
            ('tag', '<' + ans._tag)
            ('code', ans.code.source.replace('\\1', '\\2'))
            ('list', ans.list.source.replace('\\1', '\\3'))
            ();

        return (ans);
    }();
    //区段元素规则
    const inline = function() {
        const ans = {
            escape: /^\\([\\`*{}\[\]()#+\-.!_>~|])/,      //这个是特殊符号的转义
            url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
            tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
            link: /^!?\[(inside)\]\(href\)/,
            strong: /^\*\*([\s\S]+?)\*\*(?!\*)/,
            em: /^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
            sub: /^\b_((?:[^_\n])+?)_/,
            sup: /^\^((?:[^\^\n])+?)\^/,
            code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
            del: /^~~(?=\S)([\s\S]*?\S)~~/,
            mathinline: /^\$\$ *([\\\{\}\-\(\)a-zA-Z0-9<>\|,&_^+*/.= '\[\]]+?) *\$\$/,
            mathblock: /^\$\$ *\n[\n ]*([\\\{\}\-\(\)\[\]\na-zA-Z0-9<>\|,&_^+*/.= ']+?)[\n ]*\n\$\$ *(?:$|\n)/,
            text: /^[\s\S]+?(?=[\\<!\[_*`~\^(?:\$\$)]|https?:\/\/| *\n|$)/
        };

        ans._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
        ans._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

        ans.link = replace(ans.link)
            ('inside', ans._inside)
            ('href', ans._href)
            ();

        return ans;
    }();
    //区段元素解析器
    function inlineLexer(src, render) {
        let out = '', title = '',
            text = '', href = '', cap = '';

        while (src) {
            // escape       特殊字符转义
            if (cap = inline.escape.exec(src)) {
                src = src.substring(cap[0].length);
                out += cap[1];
                continue;
            }
            // mathinline   行内公式
            if (cap = inline.mathinline.exec(src)) {
                src = src.substring(cap[0].length);
                out += render.mathinline(cap[1]);
                continue;
            }
            // mathblock    块级公式
            if (cap = inline.mathblock.exec(src)) {
                src = src.substring(cap[0].length);
                out += render.mathblock(cap[1]);
                continue;
            }
            // url          裸露链接
            if (cap = inline.url.exec(src)) {
                src = src.substring(cap[0].length);
                text = cap[1];
                href = text;
                out += render.link(href, null, text);
                continue;
            }
            // tag          标签
            if (cap = inline.tag.exec(src)) {
                src = src.substring(cap[0].length);
                out += escape(cap[0]);
                continue;
            }
            // link image   行内链接、图片
            if (cap = inline.link.exec(src)) {
                src = src.substring(cap[0].length);

                title = cap[3] ? escapeEx(cap[3]) : null;
                href = cap[2];

                out += (cap[0].charAt(0) !== '!')
                    ? render.link(href, title, escapeEx(inlineLexer(cap[1], render)))
                    : render.image(href, title, escapeEx(inlineLexer(cap[1], render)));

                continue;
            }
            // strong       粗体
            if (cap = inline.strong.exec(src)) {
                src = src.substring(cap[0].length);
                out += render.strong(escapeEx(inlineLexer(cap[2] || cap[1], render)));
                continue;
            }
            // em           斜体
            if (cap = inline.em.exec(src)) {
                src = src.substring(cap[0].length);
                out += render.em(escapeEx(inlineLexer(cap[2] || cap[1], render)));
                continue;
            }
            // code         行内代码
            if (cap = inline.code.exec(src)) {
                src = src.substring(cap[0].length);
                out += render.codespan(escape(cap[2]));
                continue;
            }
            // del          删除线
            if (cap = inline.del.exec(src)) {
                src = src.substring(cap[0].length);
                out += render.del(escape(inlineLexer(cap[1], render)));
                continue;
            }
            // sub          下标
            if (cap = inline.sub.exec(src)) {
                src = src.substring(cap[0].length);
                out += render.sub(escape(cap[1]));
                continue;
            }
            // sup          上标
            if (cap = inline.sup.exec(src)) {
                src = src.substring(cap[0].length);
                out += render.sup(escape(cap[1]));
                continue;
            }
            // text         纯文本
            if (cap = inline.text.exec(src)) {
                src = src.substring(cap[0].length);
                out += render.text(escape(cap[0]));
                continue;
            }

            if (src) {
                throw new
                    Error('Infinite loop on byte: ' + src.charCodeAt(0));
            }
        }

        return out;
    }
    //词法分析
    function lexer(context) {
        const tokens = [],
            rules = block,
            elem = context
                .replace(/\r\n|\r/g, '\n')
                .replace(/\t/g, '    ')
                .replace(/\u00a0/g, ' ')
                .replace(/\u2424/g, '\n');

        //词法分解
        (function token(txt, top){
            let src = txt.replace(/^ +$/gm, ''),
                next = '', loose = '', cap = '', bull = '',
                item = '', space = 0, i = 0, l = 0;

            while (src) {
                // newline
                if (cap = rules.newline.exec(src)) {
                    src = src.substring(cap[0].length);
                    if (cap[0].length > 1) {
                        tokens.push({
                            type: 'space'
                        });
                    }
                }
                // code
                if (cap = rules.code.exec(src)) {
                    src = src.substring(cap[0].length);
                    tokens.push({
                        type: 'code',
                        lang: cap[2],
                        text: cap[3] || ''
                    });
                    continue;
                }
                // heading
                if (cap = rules.heading.exec(src)) {
                    src = src.substring(cap[0].length);
                    tokens.push({
                        type: 'heading',
                        depth: cap[1].length,
                        text: cap[2]
                    });
                    continue;
                }
                // hr
                if (cap = rules.hr.exec(src)) {
                    src = src.substring(cap[0].length);
                    tokens.push({
                        type: 'hr'
                    });
                    continue;
                }
                // blockquote
                if (cap = rules.blockquote.exec(src)) {
                    src = src.substring(cap[0].length);

                    tokens.push({
                        type: 'blockquote_start'
                    });

                    cap = cap[0].replace(/^ *> ?/gm, '');

                    //递归分解引用的内部元素
                    token(cap, top);

                    tokens.push({
                        type: 'blockquote_end'
                    });

                    continue;
                }
                // list
                if (cap = rules.list.exec(src)) {
                    src = src.substring(cap[0].length);
                    bull = cap[2];

                    tokens.push({
                        type: 'list_start',
                        ordered: bull.length > 1
                    });

                    // 匹配每行元素
                    cap = cap[0].match(rules.item);

                    next = false;
                    l = cap.length;
                    i = 0;

                    for (; i < l; i++) {
                        item = cap[i];

                        // Remove the list item's bullet
                        // so it is seen as the next token.
                        space = item.length;
                        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

                        // 下级列表
                        if (~item.indexOf('\n ')) {
                            space -= item.length;
                            item = item.replace(/^ {1,4}/gm, '');
                        }

                        // Determine whether item is loose or not.
                        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
                        // for discount behavior.
                        loose = next || /\n\n(?!\s*$)/.test(item);
                        if (i !== l - 1) {
                            next = item.charAt(item.length - 1) === '\n';
                            if (!loose) loose = next;
                        }

                        tokens.push({
                            type: loose
                                ? 'loose_item_start'
                                : 'list_item_start'
                        });

                        // 递归分解
                        token(item, false);

                        tokens.push({
                            type: 'list_item_end'
                        });
                    }

                    tokens.push({
                        type: 'list_end'
                    });

                    continue;
                }
                // html
                if (cap = rules.html.exec(src)) {
                    src = src.substring(cap[0].length);
                    tokens.push({
                        type: 'html',
                        pre: (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
                        text: cap[0]
                    });
                    continue;
                }
                // table
                if (top && (cap = rules.table.exec(src))) {
                    src = src.substring(cap[0].length);

                    item = {
                        type: 'table',
                        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
                        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
                        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
                    };

                    for (i = 0; i < item.align.length; i++) {
                        if (/^ *-+: *$/.test(item.align[i])) {
                            item.align[i] = 'right';
                        } else if (/^ *:-+: *$/.test(item.align[i])) {
                            item.align[i] = 'center';
                        } else if (/^ *:-+ *$/.test(item.align[i])) {
                            item.align[i] = 'left';
                        } else {
                            item.align[i] = null;
                        }
                    }

                    for (i = 0; i < item.cells.length; i++) {
                        item.cells[i] = item.cells[i]
                            .replace(/^ *\| *| *\| *$/g, '')
                            .split(/ *\| */);
                    }

                    tokens.push(item);

                    continue;
                }
                // top-level paragraph
                if (top && (cap = rules.paragraph.exec(src))) {
                    src = src.substring(cap[0].length);
                    tokens.push({
                        type: 'paragraph',
                        text: cap[1].charAt(cap[1].length - 1) === '\n'
                            ? cap[1].slice(0, -1)
                            : cap[1]
                    });
                    continue;
                }
                // text
                if (cap = rules.text.exec(src)) {
                    // Top-level should never reach here.
                    src = src.substring(cap[0].length);
                    tokens.push({
                        type: 'text',
                        text: cap[0]
                    });
                    continue;
                }
                // 错误处理
                if (src) {
                    throw new
                        Error('Infinite loop on byte: ' + src.charCodeAt(0));
                }
            }
        })(elem, true);

        return tokens;
    }
    //语法解析
    function parser(context, render) {
        const tokens = context.reverse(),
            renderer = render || new Renderer();

        let out = '', toke = void 0;
        while (toke = tokens.pop()) {
            out += function tok(token) {
                switch (token.type) {
                    case 'space': {
                        return '';
                    }
                    case 'hr': {
                        return renderer.hr();
                    }
                    case 'heading': {
                        return renderer.heading(
                            inlineLexer(token.text, render),
                            token.depth,
                            token.text
                        );
                    }
                    case 'code': {
                        //代码中可能含有标签，所以这里必须转义
                        return renderer.code(token.text,
                            token.lang
                        );
                    }
                    case 'table': {
                        let header = '', body = '', row = '',
                            cell = '', flags = void 0, i = 0, j = 0;

                        // 表格头
                        cell = '';
                        for (i = 0; i < token.header.length; i++) {
                            flags = { header: true, align: token.align[i] };
                            cell += renderer.tablecell(
                                inlineLexer(token.header[i], render),
                                { header: true, align: token.align[i] }
                            );
                        }
                        header += renderer.tablerow(cell);

                        for (i = 0; i < token.cells.length; i++) {
                            row = token.cells[i];

                            cell = '';
                            for (j = 0; j < row.length; j++) {
                                cell += renderer.tablecell(
                                    inlineLexer(row[j], render),
                                    { header: false, align: token.align[j] }
                                );
                            }

                            body += renderer.tablerow(cell);
                        }
                        return renderer.table(header, body);
                    }
                    case 'blockquote_start': {
                        let body = '';

                        while ((toke = tokens.pop()).type !== 'blockquote_end') {
                            body += tok(toke);
                        }

                        return renderer.blockquote(body);
                    }
                    case 'list_start': {
                        let body = '';
                        const ordered = token.ordered;

                        while ((toke = tokens.pop()).type !== 'list_end') {
                            body += tok(toke);
                        }

                        return renderer.list(body, ordered);
                    }
                    case 'list_item_start': {
                        let body = '';

                        while ((toke = tokens.pop()).type !== 'list_item_end') {
                            body += tok(toke);
                        }

                        return renderer.listitem(body);
                    }
                    case 'loose_item_start': {
                        let body = '';

                        while ((toke = tokens.pop()).type !== 'list_item_end') {
                            body += tok(toke);
                        }

                        return renderer.listitem(body);
                    }
                    case 'html': {
                        return renderer.html(token.text);
                    }
                    case 'paragraph': {
                        return renderer.paragraph(inlineLexer(token.text, render));
                    }
                    case 'text': {
                        let body = token.text;
                        while ((tokens[tokens.length - 1] || 0).type === 'text') {
                            body += '\n' + tokens.pop().text;
                        }
                        return renderer.paragraph(inlineLexer(body, render));
                    }
                }
            }(toke);
        }
        return out;
    }
    //主程序入口
    function marked(src, renderer) {
        return (parser(lexer(src), (renderer || marked.setRender || (new Renderer()))));
    }

    //公共API
    marked.Renderer = Renderer;     //渲染器构造函数
    marked.setRender = null;        //外部渲染器入口

    //封闭当前模块
    Object.seal(marked);

    //对外接口
    if (typeof module !== 'undefined' && typeof exports === 'object') {
        module.exports = marked;
    } else if (typeof define === 'function' && define.amd) {
        define(function() { return marked; });
    } else {
        this.marked = marked;
    }

}).call(function() {
    return this || (typeof window !== 'undefined' ? window : global);
}());
