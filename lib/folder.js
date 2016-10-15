const fs = require('fs');

//创建文件夹
function createfs(path) {
    //检查路径是否存在
    if (!fs.existsSync(path)) {
        const pathArr = path.split("/");
        for(let i = 0; i < pathArr.length; i++) {
            const pathtmp = pathArr.slice(0,i + 1).join("/") + "/";
            if (!fs.existsSync(pathtmp)) {
                fs.mkdirSync(pathtmp);
            }
        }
    }
}
//复制文件夹
function copyfs(to, from) {
    //首先检查当前输出路径是否存在
    createfs(to);
    //读取输入路径列表
    const files = fs.readdirSync(from);
    for(let i = 0; i < files.length; i++) {
        const nowFrom = (from + "/" + files[i]).normalize(),
            nowTo = (to + "/" + files[i]).normalize();
        //检查当前路径是否是文件夹
        if(fs.lstatSync(nowFrom).isDirectory()) {
            copyfs(nowTo, nowFrom);
        } else {
            fs.writeFileSync(nowTo, fs.readFileSync(nowFrom));
        }
    }
}
//删除文件夹
function deletefs(path, opt) {
    //路径加载
    for(let i in opt) {
        if(opt.hasOwnProperty(i)) {
            if(typeof opt[i] === "string") {
                opt[i] = (path + opt[i]).normalize();
            } else if(typeof opt[i] === "object") {
                for(let j = 0; j < opt[i].length; j++) {
                    opt[i][j] = (path + opt[i][j]).normalize();
                }
            }
        }
    }

    (function delFolder(path) {
        //路径不存在，那么就直接返回
        if (!fs.existsSync(path)) { return; }
        //读取路径下的文件们
        const files = fs.readdirSync(path);
        //逐个删除
        for(let i = 0; i < files.length; i++) {
            const now = (path + "/" + files[i]).normalize();
            //检查当前路径是否是文件夹
            if(fs.lstatSync(now).isDirectory()) {
                //忽略的文件夹
                if(opt && opt.folder && opt.folder.length) {
                    if(opt.folder.indexOf(files[i] !== -1)) {
                        continue;
                    }
                }
                //递归删除文件夹内部文件
                delFolder(now);
                //删除文件夹
                fs.rmdirSync(now);
            } else {
                //忽略的文件
                if(opt && opt.file && opt.file.length) {
                    if(opt.file.indexOf(files[i] !== -1)) {
                        continue;
                    }
                }
                //删除文件
                fs.unlinkSync(now);
            }
        }
    })(path);
}

exports.copyfs = copyfs;
exports.createfs = createfs;
exports.deletefs = deletefs;
