import Vue from 'vue';

//get方法的缓存
const getData = {};
//中文路径转英文
function $path(str) {
    return /[^\x00-\xff]/.test(str)
        ? encodeURIComponent(str)
            .replace(/%2F/g, '/')
            .replace(/%/g, '')
            .toLowerCase()
        : str.toLowerCase();
}
// ajax 方法
function get(input) {
    const url = $path(input) + '.json';
    return new Promise((res, rej) => {
        //链接数据已经存在，导出数据副本
        if (getData[url]) {
            setTimeout(() => res(clone(getData[url])));
            return (true);
        }

        const oAjax = new XMLHttpRequest();
        oAjax.open('GET', url, true);
        oAjax.send();
        oAjax.onreadystatechange = function() {
            if (oAjax.readyState === 4) {
                if (oAjax.status === 200) {
                    //转换数据格式并缓存
                    getData[url] = JSON.parse(oAjax.responseText);
                    res(clone(getData[url]));
                } else {
                    rej(oAjax);
                }
            }
        };
    }).catch((e) => console.log(e));
}
//ajax方法
function ajax(urls) {
    if (typeof urls === 'string') {
        return get(urls).catch((e) => console.info(e));
    } else if (urls instanceof Array) {
        return Promise.all(urls.map((url) => get(url)))
            .catch((e) => console.info(e));
    }
}
//部分英汉转换
Vue.prototype.$t = function(str) {
    const transfrom = {
        'categories': '分类',
        'tags': '标签',
        'time': '时间'
    };

    return transfrom[str]
        ? transfrom[str]
        : str;
};

//对象深复制，不考虑循环引用的情况
function cloneObj(from) {
    return Object.keys(from)
        .reduce((obj, key) => (obj[key] = clone(from[key]), obj), {});
}
//数组深复制，不考虑循环引用的情况
function cloneArr(from) {
    return from.map((n) => clone(n));
}
// 复制输入值
function clone(from) {
    if (from instanceof Array) {
        return cloneArr(from);
    } else if (from instanceof Object) {
        return cloneObj(from);
    } else {
        return (from);
    }
}

// 延迟函数
function delay(fn, time = 0) {
    return new Promise((resolve) => setTimeout(() => (fn(), resolve()), time));
}

export { ajax, clone, delay };
