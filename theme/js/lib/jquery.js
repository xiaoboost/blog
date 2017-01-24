//类似jQuery的库，项目中所有关于DOM的操作都在这里
//仅仅是API类似而已，其中的实现细节和原版差距很大

const w = window,
    u = undefined,
    obj = 'object',
    str = 'string',
    fun = 'function',
    num = 'number',
    doc = w.document,
    rnotwhite = /\S+/g,
    slice = Array.prototype.slice,
    ran = 'event' + (1 + Math.random()).toFixed(10).toString().replace( /\D/g, '' );

//空函数
function returnTrue() {
    return (true);
}
function returnFalse() {
    return (false);
}
//是否是类似数组的元素
function isArrayLike(obj) {
    const length = !!obj && 'length' in obj && obj.length,
        type = typeof obj;

    if (type === 'function') {
        return false;
    }

    return type === 'array' || length === 0 ||
        typeof length === 'number' && length > 0 && (length - 1) in obj;
}
//是否是函数
function isFunction(obj) {
    return (typeof obj === 'function');
}
//是否是空对象
function isEmptyObject(obj) {
    for (const name in obj) if (obj.hasOwnProperty(name)) {
        return false;
    }
    return true;
}
//是否是网页元素
function isElement(elem) {
    return elem.setAttribute && elem.classList && elem.hasAttribute;
}
//事件部分的输入聚合
function types(type, fn) {
    let ans = {};

    if (typeof type === 'object') {
        //多个事件
        ans = type;
    } else {
        //单个事件
        ans[type] = fn;
    }

    return (ans);
}
//$类定义
function $(selector, context, namespace) {
    return new $.fn.init(selector, context, namespace);
}
$.fn = $.prototype = {
    constructor: $,
    length: 0,
    push(elem) {
        $(elem).each((n) => {
            this[this.length] = n;
            this.length++;
        });
        return (this);
    },
    pop() {
        const ans = this[this.length - 1];
        delete this[this.length - 1];
        this.length --;
        return ($(ans));
    },
    each(callback) {
        for (let i = 0; i < this.length; i++) {
            callback(this[i], i);
        }
    },
    map(callback) {
        const ans = [];
        for (let i = 0; i < this.length; i++) {
            ans.push(callback(this[i], i));
        }
        return (ans);
    },
    //真正的构造函数
    init(selector, context, namespace) {
        //如果输入的已经是jq元素，那么直接返回这个jq元素
        if (selector instanceof $.fn.init) {
            return (selector);
        }

        //创建html元素部分
        if (typeof selector === str && selector[0] === '<' && selector[selector.length - 1] === '>') {
            //$('<html>')
            if (typeof context === str && namespace === u) {
                //$('<html>', namespace)
                namespace = context;
                context = {};
            } else if (typeof context === str && typeof namespace === obj) {
                //$('<html>', namespace, attr)
                const temp = namespace;
                namespace = context;
                context = temp;
            }
            selector = selector.substring(1, selector.length - 1);
            //没有命名空间，那么就以普通方式创建标签
            if (!namespace) {
                this.push(doc.createElement(selector));
            } else {
                this.push(doc.createElementNS(namespace, selector));
            }
            this.attr(context);
            return this;
        }

        //选择html元素部分
        const root = context ? $(context) : root$;

        if (!selector) {
            //空或者非法输入：$(''), $(null), $(undefined), $(false)
            return this;
        } else if (typeof selector === str) {
            //$(HTML strings)
            root.each((n) => {
                const all = n.querySelectorAll(selector);
                for (let i = 0; i < all.length; i++) {
                    this.push(all[i]);
                }
            });
        } else if (selector.nodeType || selector === w) {
            //$(DOMElement)
            this[0] = selector;
            this.length = 1;
            return (this);
        }
        //this.selector = selector;
        //this.preObject = root;
    },
    //改变内联样式，flag为是否删除原来属性，默认不删除
    css(name, value, flag = false) {
        if (!name) {
            return (this);
        }
        if (typeof name === obj) {
            if (flag) {
                let str = '';
                for (const i in name) if (name.hasOwnProperty(i)) {
                    str += i + '=' + name[i] + ';';
                }
                this.each((n) => n.style = str);
            } else {
                for (const i in name) if (name.hasOwnProperty(i)) {
                    this.each((n) => n.style[i] = name[i]);
                }
            }
        } else if (typeof name === str && typeof value === str || typeof value === num) {
            if (flag) {
                this.each((n) => n.style = name + '=' + value + ';');
            } else {
                this.each((n) => n.style[name] = value);
            }
        }
        return (this);
    },
    //读取或者是设置DOM的attribute
    attr(name, value) {
        if (name instanceof Array) {
            //获取很多属性，返回数组
            const ans = [];
            for (let i = 0; i < name.length; i++) {
                ans.push(this.attr(name[i]));
            }
            return (ans);
        } else if (typeof name === obj) {
            //设置多个值
            for (const i in name) if (name.hasOwnProperty(i)) {
                this.each((n) => n.setAttribute(i, name[i]));
            }
        } else if (typeof name === str && value !== u) {
            //设置单个值
            this.each((n) => n.setAttribute(name, value.toString()));
        } else if (typeof name === str && value === u) {
            //获得单个属性值
            return this[0].getAttribute(name);
        }
        return this;
    },
    prop(name, value) {
        if (typeof name === obj) {
            //设置多个值
            for (const i in name) if (name.hasOwnProperty(i)) {
                this.each((n) => n[i] = name[i]);
            }
            return this;
        } else if (typeof name === str && value !== u) {
            //设置单个值
            this.each((n) => n[name] = value);
        } else if (typeof name === str && value === u) {
            //获得属性值
            return this[0][name];
        }
        return this;
    },
    //删除attribute
    removeAttr(name) {
        if (typeof name === str) {
            this.each((n) => n.removeAttribute(name));
        }
    },
    //删除prop
    removeProp(name) {
        if (typeof name === str) {
            this.each((n) => delete n[name]);
        }
    },
    //添加class
    addClass(name) {
        name = (name || '').match(rnotwhite) || [''];
        this.each((elem) => {
            for (let i = 0; i < name.length; i++) {
                elem.classList.add(name[i]);
            }
        });
    },
    //删除class
    removeClass(name) {
        name = (name || '').match(rnotwhite) || [''];
        this.each((elem) => {
            for (let i = 0; i < name.length; i++) {
                elem.classList.remove(name[i]);
            }
        });
    },
    //第一个element是否含有某个class
    hasClass(name) {
        return this[0].classList.contains(name);
    },
    //是否含有某element
    hasElem(elem) {
        let ans = false;
        for (let i = 0; i < this.length; i++) {
            ans |= this[i] === elem;
            if (ans) return (ans);
        }
        return (false);
    },
    //把content匹配所有元素追加到this下标为0的元素内部的最后
    append(content) {
        if (isElement(content)) {
            this[0].appendChild(content);
        } else if (content instanceof $.fn.init) {
            content.each((n) => this[0].appendChild(n));
        }
        return ($(content));
    },
    //把content匹配所有元素追加到this下标为0的内部的某元素前面
    preappend(content, before) {
        const temp = before ? before : this[0].childNodes[0],
            topElement = (temp instanceof $.fn.init) ? temp[0] : temp;

        if (isElement(content)) {
            this[0].insertBefore(content, topElement);
        } else if (content instanceof $.fn.init) {
            content.each((n) => this[0].insertBefore(n, topElement));
        }
    },
    //把this中的所有元素追加到content内部的最后
    appendTo(content) {
        if (isElement(content)) {
            this.each((n) => content.appendChild(n));
        } else if (content instanceof $.fn.init) {
            this.each((n) => content[0].appendChild(n));
        }
    },
    //把content匹配所有元素追加到this下标为0的内部的最前面
    preappendTo(content) {
        if (isElement(content)) {
            const topElement = content.childNodes[0];
            this.each((n) => content.insertBefore(n, topElement));
        } else if (content instanceof $.fn.init) {
            const topElement = content[0].childNodes[0];
            this.each((n) => content[0].insertBefore(n, topElement));
        }
    },
    //改变元素内容
    text(string) {
        if (string === u) {
            return (this[0].textContent);
        } else if (typeof string === str) {
            this.each((n) => n.textContent = string);
            return (this);
        }
    },
    //元素内边框宽度及长度
    //非块级元素这个值是0
    innerWidth() {
        return (this[0].clientWidth);
    },
    innerHeight() {
        return (this[0].clientHeight);
    },
    //把当前DOM全部移除出HTML文档流
    remove(index) {
        if (index === u) {
            this.each((n) => n.parentNode && n.parentNode.removeChild(n));
        } else {
            const sub = (index >= 0) ?
                index : (this.length + index);

            if (index >= 0 || index < this.length) {
                this[sub].parentNode.removeChild(this[sub]);
                delete this[sub];
                for (let i = sub; i < this.length - 1; i++) {
                    this[i + 1] = this[i];
                }
                delete this[this.length - 1];
                this.length --;
            }
        }
    },
    //返回匹配元素的标号下的元素
    get(index) {
        const sub = (index >= 0) ?
            index : (this.length + index);

        if (index >= 0 || index < this.length) {
            return ($(this[sub]));
        } else {
            return (false);
        }
    },
    //求当前元素在current内的相对位置
    //current必须是this的祖先元素，且它本身必须是定位元素
    //如果没有输入current，那么返回最近的相对位置
    offset(current) {
        if (!current[0].contains(this[0])) {
            throw 'current必须是this的祖先元素';
        }
        let dom = this[0], offsetX = 0, offsetY = 0;

        while (dom !== current[0]) {
            offsetX += dom.offsetLeft;
            offsetY += dom.offsetTop;
            dom = dom.offsetParent;
            if (dom !== current[0] && dom.contains(current[0])) {
                throw 'current不是定位元素';
            }
        }
        return ([offsetX, offsetY]);
    },
    //elem是否是this[0]的子元素
    contains(elem) {
        const e = elem instanceof $
            ? elem[0] : elem;

        return (this[0].contains(e));
    },
    //返回下标为0的元素的单一层级的子元素
    childrens(start, end) {
        const ans = $();
        if (start === u && end === u) {
            for (let i = 0; i < this[0].childNodes.length; i++) {
                ans.push(this[0].childNodes[i]);
            }
        } else if (end === u) {
            const temp = slice.call(this[0].childNodes, start);
            for (let i = 0; i < temp.length; i++) {
                ans.push(temp[i]);
            }
        } else {
            const temp = slice.call(this[0].childNodes, start, end);
            for (let i = 0; i < temp.length; i++) {
                ans.push(temp[i]);
            }
        }
        return (ans);
    },

    //不一定要的
    //得到第一个元素宽度
    //所有有效宽度中返回最大的那个
    width() {
        let textWidth;
        if (this[0].getClientRects) {
            const temp = this[0].getClientRects()[0];
            textWidth = temp ? temp.width : 0;
        }
        return Math.max(
            textWidth || 0,
            this[0].clientWidth || 0,
            this[0].offsetWidth || 0,
            this[0].innerWidth || 0
        );
    },
    //得到第一个元素高度
    height() {
        let textHeight;
        if (this[0].getClientRects) {
            const temp = this[0].getClientRects()[0];
            textHeight = temp ? temp.height : 0;
        }
        return Math.max(
            textHeight || 0,
            this[0].clientHeight || 0,
            this[0].offsetHeight || 0,
            this[0].innerHeight || 0
        );
    },
    //事件委托
    on(type, fn) {
        const handler = types(type, fn);

        this.each((elem) => {
            for (const type in handler) {
                if (handler.hasOwnProperty(type)) {
                    elem.addEventListener(type, fn);
                }
            }
        });

        return (this);
    },
    //事件解除委托
    off(type, fn) {
        const handler = types(type, fn);

        this.each((elem) => {
            for (const type in handler) {
                if (handler.hasOwnProperty(type)) {
                    elem.removeEventListener(type, fn);
                }
            }
        });

        return (this);
    },
    //触发事件
    trigger(event, data) {

        return this;
    },
    //绑定自定义事件
    bind(type, fn) {
        this.prop(ran, types(type, fn));
        return (this);
    },
    //解除自定义事件绑定
    unbind(type, fn) {

    },
    //触发自定义事件
    emit(type) {
        const handlers = this.prop(ran),
            func = handlers[type] || returnTrue;

        this.each((n) => func.call($(n)));
        return (this);
    },
};
//改变init构造函数的原型链
$.prototype.init.prototype = $.prototype;

//由文本创建DOM结构
$.html = function(text) {
    const temp = $('<div>');
    temp[0].innerHTML = text;
    return (temp.childrens());
};

//get方法的缓存
const getData = {};
//get方法
$.get = function(url) {
    return new Promise((res, rej) => {
        //链接数据已经存在
        if (getData[url]) {
            res(getData[url]);
            return (true);
        }

        const oAjax = (window.XMLHttpRequest)
            ? new XMLHttpRequest()
            : new ActiveXObject('Microsoft.XMLHTTP');

        oAjax.open('GET', url, true);
        oAjax.send();
        oAjax.onreadystatechange = function() {
            if (oAjax.readyState === 4) {
                if (oAjax.status === 200) {
                    //转换为DOM并缓存
                    getData[url] = $.html(oAjax.responseText);
                    res(getData[url]);
                } else {
                    rej();
                }
            }
        };
    });
};


//初始化的document
const root$ = $(doc);

export default $;
