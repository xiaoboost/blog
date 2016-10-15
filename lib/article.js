const fs = require('fs'),
    marked = require('./render'),
    attr = /\n---\n/,               //划分文章属性
    excerpt = /<!--\s*more\s*-->/;  //划分正文摘要

//扩展对象，将fromObj的所有属性添加到this中（并非复制）
function extend(toObj, fromObj) {
    //输入并不是对象，直接返回
    if(!(fromObj instanceof Object)) {
        return;
    }
    for(let i in fromObj) {
        if(fromObj.hasOwnProperty(i)) {
            toObj[i] = fromObj[i];
        }
    }
};
//字符串方法扩展
extend(String.prototype, {
    //去掉全部空白字符
    trimAll() {
        return(this.replace(/\s+/g, ""));
    },
    //去除所有标签
    clearTag() {
        return this.replace(/<\/?[\d\D]+?>/g, "");
    },
    //中文转码为英文
    toUrl() {
        return(encodeURIComponent(this)
            .replace(/%/g, ""));
    },
    //路径斜杠的处理，反正统一转化为 "/"
    normalize() {
        return(this.replace(/[\/\\]+/g, "\/"));
    },
    //特殊字符转义
    unescape() {
        return this
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/, "\"")
            .replace(/&#39;/, "\'");
    },
    //为正整数左边补0
    zfill(size) {
        var s = "000000000000000" + this;
        return s.substr(s.length - size);
    }
});
//数学方法扩展
extend(Math, {
    //求正整数数量级
    rank(number) {
        if(!number) { return(0); }
        else if(number < 0) { return(false); }

        return (Math.floor(Math.log10(number)) + 1);
    }
});
//文章类
class post {
    constructor(path) {
        const file = fs.readFileSync(path.normalize(),'utf8')
                .replace(/\r\n|\r/g, '\n').split(attr),
            postConfig = file[0].split("\n");

        if(!file[1]) { return(false); }

        //读取文章属性
        for(let i = 0; i < postConfig.length; i++) {
            const con = postConfig[i].split(":");
            //没有冒号的是非法行，直接忽略
            if (con.length === 1) { continue; }

            //属性名称不允许有空格
            const key = con[0].trimAll();
            switch(key) {
                case("tag"): {
                    //标签，去掉所有空格之后按照逗号区分开
                    this[key] = con[1].trimAll()
                        .slice(1, -1).split(",");
                    break;
                }
                case("date"): {
                    //时间，按照-号区分开年月日
                    this[key] = con[1].trim()
                        .split("-");
                    break;
                }
                default: {
                    //其余情况只需要去掉首尾空格
                    this[key] = con[1].replace(/(^\s+)|(\s+$)/g, "");
                }
            }
        }

        //获取页面摘要
        const excerptSub = file[1].search(excerpt);
        if(excerptSub !== -1) {
            this.excerpts = file[1].substring(0, excerptSub).trim();
            this.content = file[1].split(excerpt)[1].trim();
        } else {
            this.excerpts = "";
            this.content = file[1].trim();
        }
        //对正文markdown解析
        this.content = marked(this.content).replace(/\n/g, "");
        //给图片增加标号
        this.imageLabel();
        //如果没有设置toc或者toc为true，那么生成目录
        if(this.toc !== "false") { this.createToc(); }
    }
    //给文章的图片添加标号
    imageLabel() {
        const content = this.content,
            imageReg = /(<span class="img-title">)([\d\D]+?)(<\/span>)/,
            total = content.match(new RegExp(imageReg.source,"g"));

        //没有图片就直接返回
        if(!total) { return(content); }
        //图片数量的数量级
        const rank = Math.rank(total.length);
        let main = content, index = 1, ans = "", cap;

        while(cap = imageReg.exec(main)) {
            const elem = cap[1] + "图" +
                String.prototype.zfill.call(index, rank) + "　" +
                cap[2] + cap[3];
            index ++;
            ans += main.substring(0, cap.index) + elem;         //替换掉标签内容
            main = main.substring(cap.index + cap[0].length);   //去除已经替换过的标签
        }
        ans += main;
        this.content = ans;
    }
    //根据文章生成目录
    createToc() {
        // 生成目录包括两个目的
        // 其一是在正文中给每个标题加上id和锚点
        // 其二是生成侧边栏目录的 html 文件
        const content = this.content,
            headTree = [], name = {},
            treeHash = [], headList = {};
        let cap, out = content;
        //构建正文章节树，从h1依次往下
        for(let i = 0; i < 6; i++) {
            const hash = treeHash[i] = [],    //层级hash表初始化
                //按照标题等级的匹配正则
                headReg = new RegExp("<h" + (i + 1) + ">([\\d\\D]+?)<\/h" + (i + 1) + ">");

            let main = out; //临时正文
            out = "";       //输出清空

            //依次匹配标题
            //之所以用这种形式而不是用match匹配之后统一for迭代是为了避免出现相同标题的情况，并且需要标题的位置信息作为hash查询的信息
            while(cap = headReg.exec(main)) {
                //目录的标签需要清除内部的所有格式
                let tocTitle = cap[1].replace(/<\/?[\d\D]+?>/g, ""),
                    bolt = tocTitle,    //这是跳转用的锚
                    last = headList[hash[hash.length - 1]];
                //寻找可用的锚
                while(name[bolt]) {
                    const _bolt = bolt.split("-");
                    if(_bolt.length === 1) {
                        bolt = bolt + "-1";
                    } else {
                        bolt = _bolt[0] + "-" + (Number(_bolt[1]) + 1);
                    }
                }
                //记录锚点
                name[bolt] = true;
                //生成节点
                const node = {
                    elem: "<h" + (i + 1) + " id=\"" + bolt + "\">" + cap[1] + "</h" + (i + 1) + ">",
                    title: cap[1],
                    level: i + 1,
                    tocTitle: tocTitle,
                    bolt: bolt,
                    child: [],
                    hash: last ?
                    last.hash + last.elem.length + cap.index :
                        cap.index
                };
                if(i) {
                    //搜索上层章节列表
                    const hash = treeHash[i - 1];
                    for(let k = 0; k < hash.length; k++) {
                        if(hash[k + 1] && hash[k] < node.hash && node.hash < hash[k + 1]) {
                            node.parent = headList[hash[k]];
                            node.parent.child.push(node);
                            break;
                        } else if(!hash[k + 1] && node.hash > hash[k]) {
                            node.parent = headList[hash[k]];
                            node.parent.child.push(node);
                            break;
                        }
                    }
                } else {
                    headTree.push(node);
                }
                headList[node.hash] = node;     //章节列表
                hash.push(node.hash);           //层级hash

                out += main.substring(0, cap.index) + node.elem;    //替换掉标签内容
                main = main.substring(cap.index + cap[0].length);   //去除已经替换过的标签
            }

            out += main;
        }
        //生成目录
        const toc = function createToc(heads, pre, clas) {
            let ans = "<ol class=\"" + clas + "\">", level = heads[0].level;

            for(let i = 0; i < heads.length; i++) {
                ans += "<li class=\"toc-item toc-level-" + level + "\">" +
                    "<a class=\"toc-link\" href=\"#" + heads[i].bolt + "\">" +
                    "<span class=\"toc-number\">" + pre + (i + 1) + ".</span>" +
                    "<span class=\"toc-text\">" + heads[i].tocTitle + "</span></a>";
                if(heads[i].child && heads[i].child.length) {
                    ans += createToc(heads[i].child, pre + (i + 1) + ".", "toc-child");
                }
                ans += "</li>";
            }

            return (ans + "</ol>");
        }(headTree, "", "toc");
        this.content = out;
        this.toc = toc;
    }
    //生成文章路径
    createPath(_base, name) {
        this.path = _base + this.date[0] + "/" + this.date[1] + "/" + name.slice(0, -3) + "/";
    }
}

module.exports = post;