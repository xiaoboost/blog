import { highlight, highlightAuto } from 'highlight.js';

const langLabel = {
    html: 'HTML',
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    c: 'C',
    'c++': 'C++',
    'c#': 'C#',
    'c艹': 'C++',
    python: 'Python',
    bash: 'Bash',
    haskell: 'Haskell',
    json: 'JSON',
};

export function CodeRenderer(code: string, lang: string) {
    /** 代码语言 */
    const lan = lang ? lang.toLowerCase() : '';
    /** 代码语言标记 */
    const label = langLabel[lan];
    /** 渲染代码 */
    const text = lan ? highlight(lan, code) : highlightAuto(code);
    /** 按照行切割代码 */
    const content = text.value.trim().split('\n').map((n) => (`<li>${n}</li>`));
    /** 代码行号 */
    const list = new Array(content.length).fill(0).map((_, i) => (`<li>${(i + 1)}</li>`));

    return (
        `<pre class="code-block code-block__lang-${lan}">` +
            (label ? `<label class="code-block__label">${langLabel[lan]}</label>` : '') +
            '<code class="code-block__list">' +
                `<ul class="code-block__gutter">${list.join('')}</ul>` +
                '<span class="code-block__wrapper">' +
                    `<ul class="code-block__code">${content.join('')}</ul>` +
                '</span>' +
            '</code>' +
        '</pre>'
    );
}
