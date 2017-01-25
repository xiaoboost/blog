const fs = require('./file-system'),
    path = require('path'),
    pug = require('pug'),
    config = require('./config'),
    Post = require('./article'),

    //链接前缀
    prefix = path.join(config.root, config.prefix);

//key排序
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
//对数组中的文章进行分页，原数组不变，不改变顺序，返回新数组
//所有文章数据都只会保留标题、摘要、路径和日期
function tabPage(arrs, peer, base) {
    const ans = [], num = peer ? peer : 1e5,
        maxPage = Math.ceil(arrs.length / num);

    ans.total = arrs.length;

    for (let i = 0; i < maxPage; i++) {
        ans.push({
            path: path.join(base, 'page' + i + '.html'),
            posts: arrs.slice(i * num, (i + 1) * num)
        });

        if (i) {
            ans[ans.length - 1].next = ans[ans.length - 2].path;
            ans[ans.length - 2].prev = ans[ans.length - 1].path;
        }
    }

    return (ans);
}

function toPath(str) {
    return encodeURIComponent(str)
        .replace(/%/g, '').toLowerCase();
}

function create() {
    const posts = fs.readdirSync(path.normalize(config.posts))
            .map((file) => (file.slice(-3) === '.md') && (new Post(path.join(config.posts, file))))
            .filter((n) => n).sort((x, y) => (+x.date.join('') < +y.date.join('')) ? 1 : -1),

        tags = {},          //标签归档
        categories = {},    //类别归档
        time = {},          //年份归档
        collect = {tags, categories, time},

        //网站数据
        site = [];

    tags.title = '标签';
    categories.title = '分类';
    time.title = '时间';

    //文章前后链接
    posts.forEach((n, i) => {
        n.next = posts[i - 1];
        n.prev = posts[i + 1];
    });

    //文章分类
    for (let i = 0; i < posts.length; i++) {
        const tagsKey = tags.keys || (tags.keys = []),
            tagsPage  = tags.page || (tags.page = {}),
            cateKeys  = categories.keys || (categories.keys = []),
            catePage  = categories.page || (categories.page = {}),
            timeKeys  = time.keys || (time.keys = []),
            timePage  = time.page || (time.page = {}),

            postTags = posts[i].tag,
            postCate = posts[i].category,
            postDate = posts[i].date[0];

        //tag
        for (let j = 0; j < postTags.length; j++) {
            const tag = postTags[j];
            if (tagsPage[tag]) {
                tagsPage[tag].push(posts[i]);
            } else {
                tagsKey.push(tag);
                tagsPage[tag] = [posts[i]];
                tagsPage[tag].path = path.join('/tags', toPath(tag) + '/');
            }
        }

        //category
        if (catePage[postCate]) {
            catePage[postCate].push(posts[i]);
        } else {
            cateKeys.push(postCate);
            catePage[postCate] = [posts[i]];
            catePage[postCate].path = path.join('/categories', toPath(postCate) + '/');
        }

        //time
        if (timePage[postDate]) {
            timePage[postDate].push(posts[i]);
        } else {
            timeKeys.push(postDate);
            timePage[postDate] = [posts[i]];
            timePage[postDate].path = path.join('/time', postDate + '/');
        }
    }

    //分别排序
    sortPost(tags, 'number');       //标签按照文章数量多少排序
    sortPost(categories, 'dict');   //类别按照字典顺序排序
    sortPost(time, 'large');       //时间按照距离现在的长短

    //归档页面分页
    for (const key in collect) {
        const arr = collect[key];
        arr.keys.forEach((n) => {
            arr.page[n] = tabPage(
                arr.page[n],
                config.per_post.archive,
                arr.page[n].path
            );
        });
    }
    //首页分页
    const index = tabPage(
        posts,
        config.per_post.index,
        path.normalize('/index/')
    );

    //生成主页
    site.push({
        path: path.normalize('/index.html'),
        body: pug.renderFile('./theme/layout/index.pug', {
            config
        })
    });
    //生成主页侧边栏
    site.push({
        path: path.join(prefix, '/index/aside.html'),
        body: pug.renderFile('./theme/layout/index-aside.pug', {
            categories,
            tags,
            links: config.friend_link
        })
    });
    //生成主页文章列表
    index.forEach((n, i) => {
        site.push({
            path: path.join(prefix, n.path),
            body: pug.renderFile('./theme/layout/index-list.pug', {
                posts: n.posts,
                next: n.next,
                prev: n.prev,
                total: index.length,
                cur: i
            })
        });
    });
    //生成所有文章页面
    posts.forEach((post) => {
        site.push({
            path: path.join(prefix, post.path),
            body: pug.renderFile('./theme/layout/post.pug', {
                post
            })
        });
    });
    //生成所有归档页面
    Object.keys(collect).forEach((name) => {
        const collection = collect[name];
        //侧边栏
        site.push({
            path: path.join(prefix, name, '/aside.html'),
            body: pug.renderFile('./theme/layout/archives-aside.pug', {
                name,
                collection
            })
        });
        //文章列表
        collection.keys.forEach((key) => {
            const pages = collection.page[key];
            pages.forEach((page) => site.push({
                path: path.join(prefix, page.path),
                body: pug.renderFile('./theme/layout/archives-list.pug', page)
            }));
        });
    });

    site.forEach((n) => {
        n.lastModified = (new Date).toUTCString();
        n.body = Buffer.from(n.body);
    });

    return (site);
}

module.exports = function(output, fsm) {
    const site = create();
    site.forEach((n) => fs.writeFileSync(
        path.join(output, n.path),
        n.body,
        fsm
    ));
};
