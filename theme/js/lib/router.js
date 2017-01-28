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
        paras[1] = paras[1].replace(/%/g, '')
            .toLowerCase();
        return ([
            '/api/' + paras[0] + '/aside.html',
            '/api/' + paras[0] + '/' + paras[1] + '/page' + paras[2] + '.html'
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

            for (let i = 0; i < 2; i++) {
                if (page[i] !== doms[i]) {
                    append.push(doms[i]);
                    remove.push(page[i]);
                }
            }
            //备份当前页面
            page = doms;
            //移除元素时以vision开始
            remove.addClass('vision');
            //给浏览器预留渲染时间
            setTimeout(() => {
                res([remove, append]);
            }, 5);
        })).then(([remove, append]) => new Promise((res) => {
            remove.removeClass('vision');
            //“移除动作”的动画
            remove.addClass('disapear');
            //600ms后彻底移除元素
            setTimeout(() => {
                remove.remove();
            }, 400);
            //300ms后开始“加载动作”动画
            setTimeout(() => {
                res(append);
            }, 200);
        })).then((append) => new Promise((res) => {
            //“加载动作”的动画以disapear为起点
            append.addClass('disapear');
            //元素添加至当前网页
            $('article#container').append(append);
            //给浏览器预留渲染时间
            setTimeout(() => {
                res(append);
            }, 5);
        })).then((append) => new Promise((res) => {
            append.removeClass('disapear');
            //“添加动作”的动画
            append.addClass('vision');
            setTimeout(() => {
                append.removeClass('vision');
            }, 400);
        }));
}

$(window).on('popstate', urlRouter);

export default urlRouter;
