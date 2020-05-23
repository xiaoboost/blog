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

function getSpaceWidth(str: string) {
    const result = /^ +/.exec(str);
    return result ? result[0].length : 0;
}

function getHighlightCode(code: string) {
    const hlLabel = /\/\*\*\* +hl +\*\*\*\//g;
    const highlightLine: Record<number, boolean> = {};
    const lines = code.trim().split(/[\n\r]+/).map((line, index) => {
        const match = line.match(hlLabel);

        if (match) {
            line = line.replace(hlLabel, '');
            highlightLine[index] = true;
        }

        return line.trimRight();
    });

    return {
        code: lines.join('\n'),
        lines: highlightLine,
    };
}

export function CodeRenderer(input: string, lang: string) {
    /** 代码语言 */
    const lan = lang ? lang.toLowerCase() : '';
    /** 代码语言标记 */
    const label = langLabel[lan];
    /** 经处理的代码和高亮行 */
    const { code, lines } = getHighlightCode(input);
    /** 渲染代码 */
    const text = lan ? highlight(lan, code) : highlightAuto(code);
    /** 按行切割代码 */
    const codeLines = text.value.trim().split('\n');
    /** 总共有多少前置空格 */
    const totalSpace = codeLines.reduce((ans, line) => ans + getSpaceWidth(line), 0);
    /** 空格宽度 */
    const splitWidth = (totalSpace % 4 === 0) ? 4 : 2;
    /** 空格字符串 */
    const stringSpace = Array(splitWidth).fill(' ').join('');
    /** 按照行编译代码 */
    const content = codeLines.map((line, index) => {
        const space = getSpaceWidth(line);
        const number = space / splitWidth;
        const spaceWithSplit = Array(number).fill(`<span class="code-block__split"></span>${stringSpace}`).join('');
        const newLine = line.replace(/^ +/, spaceWithSplit);

        return lines[index]
            ? `<li class="code-block__highlight-line">${newLine}</li>`
            : `<li>${newLine}</li>`;
    });
    /** 代码行号 */
    const list = new Array(codeLines.length).fill(0).map((_, i) => {
        return lines[i]
            ? `<li class="code-block__highlight-line">${i + 1}</li>`
            : `<li>${i + 1}</li>`;
    });

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
