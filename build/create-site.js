const fs = require('fs'),
    path = require('path'),
    chokidar = require('chokidar'),
    Post = require('./article'),
    per_post = require('../config/site').per_post,
    // 文章路径
    mdFiles = path.join(__dirname, '../src/assets/post/'),
    // 网站数据
    site = {};

// 路径规范转换
String.prototype.toPosix = function() {
    return this.replace(/\\/g, '/');
};
// key排序
function sortPost(obj, sort) {
    if (!sort || sort === 'dict') {
        obj.keys.sort();
    } else if (sort === 'large') {
        obj.keys.sort((x, y) => (+x < +y) ? 1 : -1);
    } else if (sort === 'number') {
        obj.keys.sort(function(x, y) {
            const lenx = obj.page[x].length,
                leny = obj.page[y].length;

            if (lenx < leny) {
                return (1);
            } else {
                return (-1);
            }
        });
    }
}
// 对数组中的文章进行分页，原数组不变，不改变顺序，返回新数组
// 所有文章数据都只会保留标题、摘要、路径和日期
function tabPage(arrs, peer, base) {
    const ans = [],
        num = peer ? peer : 1e5,
        maxPage = Math.ceil(arrs.length / num);

    ans.total = arrs.length;

    for (let i = 0; i < maxPage; i++) {
        ans.push({
            path: path.join(base, 'page' + i),
            posts: arrs.slice(i * num, (i + 1) * num),
        });

        if (i) {
            ans[i].next = ans[i - 1].path;
            ans[i - 1].prev = ans[i].path;
        } else {
            ans[0].next = '';
            ans[0].prev = '';
        }
    }

    if (ans.length > 1) {
        ans[ans.length - 1].prev = '';
        ans[1].next = base;
    }
    return (ans);
}
// 中英文路径转换
function toPath(str) {
    return encodeURIComponent(str)
        .replace(/%/g, '').toLowerCase();
}

// 读取所有文件的路径
function readAllDir(base) {
    const ans = [];

    fs.readdirSync(base).forEach((name) => {
        const filePath = path.join(base, name),
            file = fs.statSync(filePath);

        if (file.isDirectory()) {
            ans.push(...readAllDir(filePath));
        } else if (name.slice(-3) === '.md') {
            ans.push(filePath);
        }
    });

    return (ans);
}

function create() {
    // 生成所有文章，并排序
    const posts = readAllDir(mdFiles)
            .map((file) => new Post(file))
            .sort((x, y) => (+x.date.join('') < +y.date.join('')) ? 1 : -1),
        // 分类聚合对象
        collection = {},
        tags = collection.tags = {},             // 标签归档
        categories = collection.categories = {}, // 类别归档
        time = collection.time = {};             // 年份归档

    // 文章前后链接
    posts.forEach((n, i) => {
        n.next = (posts[i - 1] || false) && {
            path: posts[i - 1].path,
            title: posts[i - 1].title,
        };
        n.prev = (posts[i + 1] || false) && {
            path: posts[i + 1].path,
            title: posts[i + 1].title,
        };
    });

    // 文章分类
    for (let i = 0; i < posts.length; i++) {
        const tagsKey = tags.keys || (tags.keys = []),
            tagsPage = tags.page || (tags.page = {}),
            cateKeys = categories.keys || (categories.keys = []),
            catePage = categories.page || (categories.page = {}),
            timeKeys = time.keys || (time.keys = []),
            timePage = time.page || (time.page = {}),

            postTags = posts[i].tag,
            postCate = posts[i].category,
            postDate = posts[i].date[0];

        // tag
        for (let j = 0; j < postTags.length; j++) {
            const tag = postTags[j];
            if (!tagsPage[tag]) {
                tagsKey.push(tag);
                tagsPage[tag] = [];
                tagsPage[tag].path = path.join('/tags', toPath(tag));
            }
            tagsPage[tag].push(posts[i].simple());
        }

        // category
        if (!catePage[postCate]) {
            cateKeys.push(postCate);
            catePage[postCate] = [];
            catePage[postCate].path = path.join('/categories', toPath(postCate));
        }
        catePage[postCate].push(posts[i].simple());

        // time
        if (!timePage[postDate]) {
            timeKeys.push(postDate);
            timePage[postDate] = [];
            timePage[postDate].path = path.join('/time', toPath(postDate));
        }
        timePage[postDate].push(posts[i].simple());
    }

    // 分别排序
    sortPost(tags, 'number'); // 标签按照文章数量多少排序
    sortPost(categories, 'dict'); // 类别按照字典顺序排序
    sortPost(time, 'large'); // 时间按照距离现在的长短

    // 网站数据暂存
    const ans = {};
    // 归档页面分页
    for (const key in collection) {
        const arr = collection[key] || [];
        arr.keys.forEach((name) => {
            arr.page[name] = tabPage(
                arr.page[name],
                per_post.archive,
                arr.page[name].path
            );
            arr.page[name].forEach((n) => (ans[n.path] = n));
            const aside = path.join(
                arr.page[name][0].path,
                '../../aside'
            );
            ans[aside] = ans[aside] || [];
            ans[aside].push({
                key: name,
                total: arr.page[name].total,
            });
        });
    }
    // 首页分页
    tabPage(
        posts.map((n) => n.simple({ index: true })),
        per_post.index,
        path.normalize('/index/')
    ).forEach((n) => (ans[n.path] = n));

    if (ans['\\index\\page1']) {
        ans['\\index\\page1'].next = '/';
    }

    // 所有文章
    posts.forEach((post) => (ans[path.join(post.path)] = post));

    for (const i in ans) {
        const content = ans[i],
            keys = ['path', 'prev', 'next'];

        for (let j = 0; j < keys.length; j++) {
            if (typeof content[keys[j]] === 'string') {
                content[keys[j]] = content[keys[j]].toPosix();
            }
        }
    }

    // 清空site对象所有内容
    Object.keys(site).forEach((n) => delete site[n]);
    // 为所有 api 添加 json 后缀
    Object.entries(ans).forEach(([key, content]) => (site[`${key}.json`] = content));
}

// 首次运行
create();

if (process.env.NODE_ENV === 'development') {
    chokidar.watch(mdFiles, { ignored: /[/\\]\./ })
        .on('change', create)
        .on('unlink', create);
}

module.exports = site;
