//参数对象
module.exports = {
    //基本信息
    title: 'Dreaming Cat\'s',
    subtitle: '梦之上',
    description: '闲言碎语',
    author: 'Xiao',
    email: 'xiaoboost@163.com',
    language: 'zh-CN',
    logo: '/img/logo.png',
    ico: '/img/favicon.ico',
    //网址
    url: 'http://www.dreamingcat.me',
    //根目录
    root: '/',
    //生成文档前缀地址
    prefix: '/api/',
    //页面header上面的链接
    second_dir: {
        '主页': '/',
        '归档': '/archives/',
        '分类': '/categories/',
        '标签': '/tags/',
        '关于': '/archives/about/'
    },
    //文章目录
    posts: './_post',
    //配置文件目录
    theme: {
        layout: 'layout',
        css: 'css',
        font: 'font',
        js: 'js',
        img: 'img',
    },
    //文章分页
    //index是主页分页，archive是归档（分类标签年份）页面的分页，0表示不分页
    per_post: {
        index: 5,
        archive: 5
    },
    //上传设定
    deploy: {
        type: 'git',
        repo: 'https://github.com/xiaoboost/blog.git',
        branch: 'gh-pages'
    },
    //友情链接
    friend_link: {
        '电路仿真': 'https://xiaoboost.github.io/circuitlab/'
    }
};
