const //本地模块
    config = require("./lib/config"),
    post = require('./lib/article'),
    folder = require('./lib/folder'),
    deploy = require("./lib/deployer"),

    //公共模块
    fs = require("fs"),
    pug = require("pug"),
    chalk = require('chalk'),
    stylus = require("stylus"),
    babel = require("babel-core"),
    uglify = require("uglify-js"),
    autoprefixer = require('autoprefixer-stylus'),

    //输入参数
    options = process.argv.splice(2);

//没有运行参数，直接退出
if(!options) {
    console.log("ERROR：需要输入参数");
    return(false);
}

//文章分页
function splitPosts(posts, per) {
    //输入非法数值或者是0，直接返回自身
    per = Number(per);
    if(Number.isNaN(per) || !per) { return([posts.slice()]); }

    const source = posts.slice(), ans = [];
    for(let i = 0; i < parseInt(posts.length / per); i++) {
        ans.push({
            posts: source.splice(0, per)
        });
    }
    ans.push({
        posts: source.slice()
    });
    return(ans);
}
//根据总页数和当前页码，生成网址
function createUrl(current) {
    if (current === 0) {
        return ("/");
    } else if(current === -1) {
        return ("");
    } else {
        return ("/page/" + current + "/");
    }
}
//压缩某文件夹的文件
function compressFolder(to, from) {
    const files = fs.readdirSync(from);

    for (let i = 0; i < files.length; i++) {
        const file = (from + "/" + files[i]).normalize(),
            fileTo = (to + "/" + files[i]).normalize();

        fs.writeFileSync(fileTo,
            uglify.minify(
                babel.transformFileSync(file, {presets: ['es2015']}).code,
                { fromString: true }
            ).code
        );
    }
}
//复制文件
function copyFiles(base, opt) {
    const folders = ["font", "js", "img"];

    //主题的字体和图片路径
    for (let i = 0; i < folders.length; i++) {
        const path = config.theme[folders[i]];
        if (path) {
            const to = (base + path).normalize(),
                from = ("./theme/" + path).normalize();

            if (folders[i] === "js") {
                //复制库文件
                folder.copyfs(to, (from + "/lib/").normalize());
                //复制页面脚本
                if (opt && opt.compress) {
                    compressFolder(to, (from + "/cus/").normalize());
                } else {
                    folder.copyfs(to, (from + "/cus/").normalize());
                }
            } else {
                folder.copyfs(to, from);
            }
        }
    }
    //文章的图片们
    folder.copyfs((base + "/img/").normalize(), "./_post/img/");
    //复制CNAME文件
    fs.writeFileSync((base + "/CNAME").normalize(), fs.readFileSync("./CNAME"));
}
//生成css文件
function stylus2css(base) {
    const inputPath = "./theme/css/",
        inputFile = "style.styl",
        outputPath = (base + "/css/").normalize(),
        outputFile = "style.css";

    //生成输出文件夹
    folder.createfs(outputPath);
    //生成css文件
    stylus(fs.readFileSync(inputPath + inputFile, "utf8"))
        .include(inputPath)
        .set('compress', true)
        .use(autoprefixer())
        .render(function(err, css){
            if (err) throw err;
            fs.writeFileSync(outputPath + outputFile, css);
        });
}
//生成网页并发送到base路径
function html2file(base) {
    //常量定义
    const site = [],        //网站数据

        posts = [],         //所有文章
        tags = {},          //标签归档
        categories = {},    //分类归档
        years = {},         //年份归档

        catePath = "/categories/",  //分类页面基础链接
        tagsPath = "/tags/",        //标签页面基础链接
        yearsPath = "/archives/",   //时间页面基础链接

        basePath = "./_post/",              //文章路径
        files = fs.readdirSync(basePath);   //所有文章列表

    //读取所有文章信息
    for(let i = 0; i < files.length; i++) {
        //后缀不是.md那么就忽略
        if(files[i].slice(-3) !== ".md") { continue; }
        //读取文章
        const page = new post(basePath + files[i]);
        page.createPath(yearsPath, files[i]);
        posts.push(page);
    }
    //把文章按照时间进行排序，下标为0的是离现在最近的文章
    posts.sort(function(x, y) {
        const valueX = Number(x.date.join("")),
            valueY =  Number(y.date.join(""));

        if(valueX < valueY) {
            return(1);
        } else {
            return(-1);
        }
    });

    //按照标签、分类以及年份再把所有文章分类
    for(let i = 0; i < posts.length; i++) {
        const post = posts[i];
        //按标签归档
        for(let j = 0; j < post.tag.length; j++) {
            if(!tags[post.tag[j]]) {
                tags[post.tag[j]] = {
                    toPath: post.tag[j].toUrl(),
                    posts: []
                };
            }
            tags[post.tag[j]].posts.push(post);
        }
        //按分类归档
        if(!categories[post.category]) {
            categories[post.category] = {
                toPath: post.category.toUrl(),
                posts: []
            };
        }
        categories[post.category].posts.push(post);
        //按年份归档
        if(!years[post.date[0]]) {
            years[post.date[0]] = [];
        }
        years[post.date[0]].push(post);
    }
    //生成主页
    let pages = splitPosts(posts, config.per_post.index);
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        //页面属性
        //总页数
        page.total = pages.length - 1;
        //当前页数
        page.current = i;
        //当前页面网址
        page.path = createUrl(i);
        //上一页的页数,如果此页是第一页的话则为 -1
        page.prev = i - 1;
        //上一页的网址,如果此页是第一页的话则为 ''
        page.prev_link = createUrl(i - 1);
        //下一页的页数,如果此页是最后一页的话则为 -1
        page.next = (i === page.total) ? -1 : i + 1
        //下一页的网址,如果此页是最后一页的话则为 ''
        page.next_link = createUrl(page.next);

        //布局类型
        page.layout = "index";
        //标题是设置中的网站标题
        page.title = config.title;

        site.push({
            path: page.path,
            content: pug.renderFile("./theme/layout/index.pug", {
                page: page,
                tags: tags,
                categories: categories,
                config: config,
            })
        });
    }
    //生成分类页面
    for(let category in categories) {
        const posts = categories[category].posts,
            path = catePath + categories[category].toPath + "/";

        site.push({
            path: path,
            content: pug.renderFile("./theme/layout/archive.pug", {
                attr: category,
                posts: posts,
                config: config
            })
        });
    }
    //生成标签页面
    for(let tag in tags) {
        const posts = tags[tag].posts,
            path = tagsPath +tags[tag].toPath + "/";

        site.push({
            path: path,
            content: pug.renderFile("./theme/layout/archive.pug", {
                attr: tag,
                posts: posts,
                config: config
            })
        });
    }
    //生成时间归档页面
    for(let year in years) {
        const posts = years[year],
            path = yearsPath + year + "/";

        site.push({
            path: path,
            content: pug.renderFile("./theme/layout/archive.pug", {
                attr: year,
                posts: posts,
                config: config
            })
        });
    }
    //生成分类集合页面
    site.push({
        path: catePath,
        content: pug.renderFile("./theme/layout/archives.pug", {
            page: {
                layout: "archives",
                title: config.title + " | 分类"
            },
            title: "分类",
            attr: "categories",
            collection: categories,
            config: config
        })
    });
    //生成标签集合页面
    site.push({
        path: tagsPath,
        content: pug.renderFile("./theme/layout/archives.pug", {
            page: {
                layout: "archives",
                title: config.title + " | 标签"
            },
            title: "标签",
            attr: "tags",
            collection: tags,
            config: config
        })
    });
    //生成时间集合页面
    site.push({
        path: yearsPath,
        content: pug.renderFile("./theme/layout/archives.pug", {
            page: {
                layout: "archives",
                title: config.title + " | 归档"
            },
            title: "归档",
            attr: "archives",
            collection: years,
            config: config
        })
    });
    //按照顺序生成所有页面
    for(let i = 0; i < posts.length; i++) {
        const post = posts[i];

        post.prev = posts[i - 1];
        post.next = posts[i + 1];

        site.push({
            path: post.path,
            content: pug.renderFile("./theme/layout/" + post.layout + ".pug", {
                page: post,
                config: config
            })
        });
    }
    //如果选项中有“关于”页面，那么就要生成它
    if(config.second_dir["关于"]) {
        const about = new post('./_post/about/about.md');
        about.path = yearsPath + 'about/';

        site.push({
            path: about.path,
            content: pug.renderFile("./theme/layout/" + about.layout + ".pug", {
                page: about,
                config: config
            })
        });
    }

    //生成所有网页页面
    for(let i = 0; i < site.length; i++) {
        const path = (base + site[i].path).normalize(),
            file = (path + "/index.html").normalize(),
            content = site[i].content;
        //创建文件夹
        folder.createfs(path);
        //生成网页文件
        fs.writeFileSync(file, content);
    }
}

//服务器模式
if(options[0] === "s" || options[0] === "service") {
    const chokidar = require('chokidar'),
        express = require("express"),
        app = express(),
        _base = "Z:/blog/";

    //清空缓存
    folder.deletefs(_base);
    //生成文件
    html2file(_base);
    stylus2css(_base);
    copyFiles(_base);

    //css文件监听
    const stylusWatcher = chokidar.watch("./theme/css/", {
        ignored: /[\/\\]\./,
        persistent: true
    });
    stylusWatcher.on("change", function(){
        stylus2css(_base);
    });
    //pug和post文件监听
    const pugWatcher = chokidar.watch(["./theme/layout/","./_post/"], {
        ignored: /[\/\\]\./,
        persistent: true
    });
    pugWatcher.on("change", function() {
        html2file(_base);
    });
    //js文件监听
    const jsWatcher = chokidar.watch("./theme/js/", {
        ignored: /[\/\\]\./,
        persistent: true
    });
    jsWatcher.on("change", function() {
        copyFiles(_base);
    });

    //允许网页访问theme文件夹
    app.use(express.static(_base));
    //建立虚拟网站，端口3000
    app.listen(3000, function () {
        console.info(chalk.green(" INFO: ") + "虚拟网站已建立于 http://localhost:3000/");
        console.info(chalk.green(" INFO: ") + "CTRL + C 退出当前状态");
    });
}
//生成器模式
if(options[0] === "g" || options[0] === "generate") {
    const _base = "./public/";

    folder.deletefs(_base);
    copyFiles(_base, {compress: true});
    stylus2css(_base);
    html2file(_base);

    console.log(chalk.green(" INFO: ") + "已经生成全部文件！");
}
//文件上传
if(options[0] === "d" || options[0] === "deploy") {
    const _base = './.deploy_git/',
        message = options[1] || (new Date()).toDateString();

    folder.deletefs(_base, [".git"]);
    copyFiles(_base, {compress: true});
    stylus2css(_base);
    html2file(_base);

    //上传文件
    deploy({ cwd: _base, encoding: "utf8" }, message);
}