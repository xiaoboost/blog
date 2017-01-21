import $ from './jquery';

//数据与路由
const routers = {};
//默认页面标题
const title = 'Dreaming Cat';

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

    //文章页面链接重置
    url = (url.indexOf('?post&') !== -1)
        ? url + '.html'
        : url;

    //分解参数
    const paras = url.split('?')[1].split('&');

    if (paras[0] === 'index') {
        return ([
            '/api/index/aside.html',
            '/api/index/page' + paras[1] + '.html'
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
function urlRouter() {
    const api = pathParser(location.href);
    
}

$(window).on('popstate', urlRouter);

export default urlRouter;
