const fs = require('fs'),
    path = require('path'),
    marked = require('./render'),

    //划分正文摘要
    excerptReg = /<!--\s*more\s*-->/;

//字符串方法扩展
Object.assign(String.prototype, {
    //去掉全部空白字符
    trimAll() {
        return this.replace(/\s+/g, '');
    },
    //去除所有标签
    clearTag() {
        return this.replace(/<\/?[\d\D]+?>/g, '');
    },
    //为正整数左边补0
    padStart(size, str) {
        const s = new Array(50).fill(str).join('') + this;
        return s.substr(s.length - size);
    }
});
//数学方法扩展
Object.assign(Math, {
    //求正整数数量级
    rank(number) {
        if (!number) {
            return 0;
        } else if (number < 0) {
            return false;
        }

        return (Math.floor(Math.log10(number)) + 1);
    }
});

//生成标题的锚点
function createBolt(str) {
    return 'B' + encodeURIComponent(str)
        .replace(/%/g, '')
        .replace(/[^a-zA-Z0-9\-_]/g, '-');
}
//生成标准目录树，并返回与之对应的修改过的正文
function createTocTree(content) {
    const headTree = [],
        name = {},
        treeHash = [],
        headList = {};

    let cap = '',
        out = content;
    //构建正文章节树，从h1依次往下
    for (let i = 0; i < 6; i++) {
        const hash = treeHash[i] = [], //层级hash表初始化
            //按照标题等级的匹配正则
            headReg = new RegExp('<h' + (i + 1) + '>([\\d\\D]+?)<\/h' + (i + 1) + '>');

        let main = out; //临时正文
        out = ''; //输出清空

        //依次匹配标题
        //之所以不用用match匹配之后统一for迭代的方式
        //是为了避免出现相同标题的情况，并且需要标题的位置信息作为hash查询的信息
        while (cap = headReg.exec(main)) {
            //目录的标签需要清除内部的所有格式
            const tocTitle = cap[1].replace(/<\/?[\d\D]+?>/g, ''),
                last = headList[hash[hash.length - 1]];
            //跳转用的锚
            let bolt = createBolt(tocTitle);

            //寻找可用的锚
            while (name[bolt]) {
                const _bolt = bolt.split('-');
                bolt = _bolt.length > 1
                    ? `${_bolt[0]}-${+_bolt[1] + 1}`
                    : `${_bolt[0]}-1`;
            }

            //记录锚点
            name[bolt] = true;
            //生成节点
            const node = {
                elem: '<h' + (i + 1) + ' id="' + bolt + '">' + cap[1] + '</h' + (i + 1) + '>',
                title: cap[1],
                level: i + 1,
                tocTitle,
                bolt,
                child: [],
                hash: last ?
                    last.hash + last.elem.length + cap.index :
                    cap.index
            };
            if (i) {
                //搜索上层章节列表
                const hash = treeHash[i - 1];
                for (let k = 0; k < hash.length; k++) {
                    if (hash[k + 1] && hash[k] < node.hash && node.hash < hash[k + 1]) {
                        node.parent = headList[hash[k]];
                        node.parent.child.push(node);
                        break;
                    } else if (!hash[k + 1] && node.hash > hash[k]) {
                        node.parent = headList[hash[k]];
                        node.parent.child.push(node);
                        break;
                    }
                }
            } else {
                headTree.push(node);
            }
            headList[node.hash] = node; //章节列表
            hash.push(node.hash); //层级hash

            out += main.substring(0, cap.index) + node.elem; //替换掉标签内容
            main = main.substring(cap.index + cap[0].length); //去除已经替换过的标签
        }

        out += main;
    }
    return {
        content: out,
        tocTree: headTree
    };
}
//根据标准目录树，生成对应的HTML文档
function renderTocTree(tocTree) {
    return function tocHTML(heads, pre, clas) {
        const level = heads[0].level;
        let ans = '<ol class="' + clas + '">';

        for (let i = 0; i < heads.length; i++) {
            ans += '<li class="toc-item toc-level-' + level + '">' +
                '<a class="toc-link" href="#' + heads[i].bolt + '">' +
                '<span class="toc-number">' + pre + (i + 1) + '.</span>' +
                '<span class="toc-text">' + heads[i].tocTitle + '</span></a>';
            if (heads[i].child && heads[i].child.length) {
                ans += tocHTML(heads[i].child, pre + (i + 1) + '.', 'toc-child');
            }
            ans += '</li>';
        }

        return (ans + '</ol>');
    }(tocTree, '', 'toc');
}
//生成简略目录树，删除标准目录树中多余及循环引用的部分
function simpleTocTree(tocTree) {
    return tocTree.map((node) => {
        const ans = Object.assign({}, node);
        delete ans.elem;
        delete ans.hash;
        delete ans.title;
        delete ans.level;
        if (ans.parent) {
            ans.parent = ans.parent.bolt;
        }
        if (ans.child.length) {
            ans.child = simpleTocTree(ans.child);
        } else {
            delete ans.child;
        }
        return ans;
    });
}

//文章类
class post {
    constructor(paths) {
        const file = fs.readFileSync(paths, 'utf8')
            .replace(/\r\n|\r/g, '\n')
            .split(/\n---+\n/),
            //文件名字将会统一转换为小写
            name = path.basename(paths, '.md').toLowerCase(),
            article = file.splice(1).join('\n---\n'),
            postConfig = file[0].split('\n'),
            excerpt = article.search(excerptReg);

        //非法文章
        if (!article) {
            return (this);
        }

        //当前文章路径文件名
        this.path = path.join('/post/', name).toPosix();
        this.name = name;

        //读取文章属性
        for (let i = 0; i < postConfig.length; i++) {
            const con = postConfig[i].split(':'),
                key = con[0].trimAll(),
                value = con[1] ? con[1].trim() : '';

            //忽略非法属性
            if (!value) {
                continue;
            }

            this[key] = value;

            if (key === 'tag') {
                this[key] = value.slice(1, -1)
                    .split(',').map((n) => n.trim());
            } else if (key === 'date') {
                this[key] = value
                    .split('-').map((n) => n.trim());
            }
        }

        //读取文章摘要
        if (excerpt !== -1) {
            this.excerpt = article.substring(0, excerpt).trim().split('\n');
            this.markdown = article.split(excerptReg)[1].trim();
        } else {
            this.excerpt = [];
            this.markdown = article.trim();
        }
    }
    //给文章的图片添加标号
    imageLabel() {
        const content = this.content,
            imageReg = /(<span class="img-title">)([\d\D]+?)(<\/span>)/,
            total = content.match(new RegExp(imageReg.source, 'g'));

        //没有图片就直接返回
        if (!total) {
            return content;
        }
        //图片数量的数量级
        const rank = Math.rank(total.length);
        let main = content, index = 1,
            ans = '', cap;

        while (cap = imageReg.exec(main)) {
            const num = String(index).padStart(rank, '0'),
                elem = `${cap[1]}图${num}　${cap[2]}${cap[3]}`;

            index++;
            //替换掉标签内容
            ans += main.substring(0, cap.index) + elem;
            //去除已经替换过的标签
            main = main.substring(cap.index + cap[0].length);
        }
        ans += main;
        this.content = ans;
    }
    //根据文章生成目录
    createToc() {
        //生成目录
        const { content, tocTree } = createTocTree(this.content);
        //简略版目录树
        this.toc = simpleTocTree(tocTree);
        //更新文章正文
        this.content = content;
    }
    //文章渲染
    render() {
        //对正文markdown解析
        this.content = marked(this.markdown).replace(/[\n\r]/g, '');
        //给图片增加标号
        this.imageLabel();
        //如果没有设置toc或者toc为true，那么生成目录
        if (this.toc === 'false') {
            this.toc = false;
        } else {
            this.createToc();
        }
    }
    //简化
    simple(opt) {
        const ans = {},
            index = (opt || {}).index,
            ess = ['title', 'path', 'date'];

        if (index) {
            ess.push('excerpt', 'tag', 'category');
        }

        ess.forEach((n) => ans[n] = this[n]);

        return (ans);
    }
}

module.exports = post;
