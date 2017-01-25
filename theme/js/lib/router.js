import $ from './jquery';

//数据与路由
const routers = {};
//默认页面标题
const title = 'Dreaming Cat';
//当前页面
let page = [];

//路径解析
function pathParser(url) {
    //主页面链接重置
    url = (url === '/')
        ? '/?index&0'
        : url;

    //归档页面链接重置
    url = (url[url.length - 1] === '/')
        ? url + '&0'
        : url;

    //分解参数
    const paras = url.split('?')[1].split('&');

    if (paras[0] === 'index') {
        return ([
            '/api/index/page' + paras[1] + '.html',
            '/api/index/aside.html'
        ]);
    } else if (paras[0] === 'post'){
        return ([
            '/api/post/' + paras[1] + '.html'
        ]);
    } else {
        return ([
            '/api/' + paras[0] + '/aside.html',
            '/api/' + paras.join('/') + '.html'
        ]);
    }
}

//前端路由
function urlRouter(handler) {
    const httpReg = /https?\:\/\/[^/]+?(\/[\d\D]*?)?$/,
        pathname = httpReg.exec(location.href)[1],
        api = pathParser(pathname);

    return Promise.all(api.map((n) => $.get(n)))
        .then((arr) => new Promise((res) => {
            //获得页面元素并与当前页面对比
            const doms = arr[0].push(arr[1]),
                remove = $(), append = $();

            doms.each((n, i) => page[i] !== n && append.push(n) && remove.push(page[i]));
            page = doms;
            remove.remove();
            res(append);
        })).then((append) => new Promise((res) => {
            $('article#container').append(append);
        }));
}

$(window).on('popstate', urlRouter);

export default urlRouter;
