window.onload = function() {
    //归档页面的前端路由
    (function (list) {
        //没有匹配到元素，说明当前页面不是分类/标签页面，直接跳出
        if (!list.length) {
            return (false);
        }

        var box = $("#main.archives-list"), select = "li",
            url = window.location.href.split("#"),
            //网址指定初始页面，默认是第一个元素
            first = $(list[0]);

        if(url.length > 1) {
            for(let i = 0 ; i < list.length; i++) {
                if($(list[i]).attr("title") === url[1]) {
                    first = $(list[i]);
                    break;
                }
            }
        }

        box.load(first.attr("data-src") + " " + select);
        first.addClass("current");
        list.each(function () {
            $(this).click(function () {
                box.load($(this).attr("data-src") + " " + select);
                list.removeClass("current");
                $(this).addClass("current");
            });
        });
    })($("div.archives-title a"));
    //跳转到顶端按钮
    (function (upperLimit, scrollSpeed) {
        const scrollElem = $('#goto-up'),
            doc = $(document);
        //元素隐藏
        scrollElem.hide();
        //屏幕滚动
        doc.on("scroll", function() {
            if (doc.scrollTop() > upperLimit) {
                scrollElem.stop().fadeTo(300, 1);
            } else {
                scrollElem.stop().fadeTo(300, 0);
            }
        }).trigger("scroll");
        //点击回到顶端按钮
        $(scrollElem).click(function () {
            $('html, body').animate({scrollTop: 0}, scrollSpeed);
            return (false);
        });
    })(300, 500);
    //侧边栏跟随
    (function (aside) {
        if(!aside.length) {
            return(false);
        }
        //初次运行时目录的位置
        const doc = $(document),
            div = $(" > div", aside),
            bias = 40;

        doc.on("scroll", function() {
            //边栏目录的位置
            const tocTop = $("#main").offset().top,
                doc2Top = doc.scrollTop() + bias;

            if (doc2Top > tocTop) {
                if(!div.hasClass("fixed")) {
                    div.addClass("fixed");
                }
            } else {
                if(div.hasClass("fixed")) {
                    div.removeClass("fixed");
                }
            }
        }).trigger("scroll");

    })($("article#container > aside"));
    //post页面的目录
    (function (aside, bias) {
        if(!aside.length) {
            return(false);
        }
        const tocHash = {},
            doc = $(document),
            post = $("#main > article.post-content"),
            heads = $("h1,h2,h3,h4,h5,h6", post);
        let meunSave = [];      //用于保存上次点亮的所有元素

        //生成章节目录树
        (function createToc(toc, parent) {
            const ans = [];
            for(let i = 0; i < toc.childNodes.length; i++) {
                const node = {},
                    elem = toc.childNodes[i],
                    bolt = elem.childNodes[0].getAttribute("href").substring(1),
                    child = (elem.childNodes.length === 2) ?
                        createToc(elem.childNodes[1], node) : undefined;

                node.elem = $(elem);
                node.bolt = bolt;
                node.child = child;
                node.parent = parent;

                tocHash[bolt] = node;
                ans.push(node);
            }
            return(ans);
        })(document.querySelector("#post-toc > div > ol"));

        //绑定页面滚动事件
        doc.on("scroll", function() {
            //边栏目录的位置
            const doc2Top = doc.scrollTop() + bias;
            let min = Infinity, head;
            //屏幕上方离屏幕最近的元素
            for(let i = 0; i < heads.length; i++) {
                const _head = $(heads[i]),
                    head2top = _head.offset().top;
                if(head2top < doc2Top && (doc2Top - head2top) < min) {
                    min = doc2Top - head2top;
                    head = _head;
                }
            }
            //head不存在，说明屏幕顶端在文章上方，删除目录中所有current类
            if (!head) {
                $(".toc-current", aside).removeClass("toc-current");
                $(".toc-child-vision", aside).removeClass("toc-child-vision");
                meunSave = [];
                return (true);
            }
            //对应到目录树中元素
            head = tocHash[head.attr("id")];
            //末点节点是否和上次相同
            if(meunSave[meunSave.length - 1] === head) {
                return(true);
            }
            //沿着节点向上查询
            const current = [head];
            while(head.parent) {
                current.push(head.parent);
                head = head.parent;
            }
            current.reverse();  //反转之后，0下标是h1标签
            for(let i = 0; i < meunSave.length; i++) {
                meunSave[i].elem.removeClass("toc-current toc-child-vision");
            }
            for(let i = 0; i < current.length - 1; i++) {
                current[i].elem.addClass("toc-current toc-child-vision");
            }
            current[current.length - 1].elem.addClass("toc-current");
            meunSave = current;
        }).trigger("scroll");
    })($("aside#post-toc"), 40);
};