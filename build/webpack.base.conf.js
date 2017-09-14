const fs = require('fs'),
    path = require('path'),
    utils = require('./utils'),
    config = require('../config'),
    vueLoaderConfig = require('./vue-loader.conf');

// 将工作区路径拼接为绝对路径
function resolve(dir) {
    return path.join(__dirname, '..', dir);
}

function readdir(dir) {
    const ans = [];

    fs.readdirSync(resolve(`src/${dir}`)).forEach((name) => {
        const nextPath = path.join(dir, name),
            filePath = resolve(`src/${nextPath}`),
            file = fs.statSync(filePath);

        if (file.isDirectory()) {
            ans.push(...readdir(nextPath));
        } else if (name.slice(-3) === '.js') {
            ans.push(filePath);
        }
    });

    return (ans);
}

module.exports = {
    entry: {
        common: [
            'vue',
            'vue-router',
            ...readdir('libraries'),
            ...readdir('directives'),
        ],
        // 编译文件入口
        main: './src/main.js'
    },
    output: {
        // 编译输出的静态资源根路径
        path: config.build.assetsRoot,
        // 编译输出的文件名
        filename: '[name].js',
        // 根据当前环境配置静态资源路径
        publicPath: process.env.NODE_ENV === 'production'
            ? config.build.assetsPublicPath
            : config.dev.assetsPublicPath
    },
    resolve: {
        // 自动补全的扩展名
        extensions: ['.js', '.vue', '.json', '.styl'],
        // 默认路径代理
        // 例如 import Vue from 'vue'，会自动到 'vue/dist/vue.common.js'中寻找
        alias: {
            '@': resolve('src'),
            '@config': resolve('config'),
            'vue$': 'vue/dist/vue.common.js'
        }
    },
    module: {
        rules: [
            {
                // 预处理器，在这里将会使用eslint进行格式检查
                test: /\.(js|vue)$/,
                loader: 'eslint-loader',
                enforce: 'pre',
                include: [resolve('src'), resolve('test')],
                options: {
                    formatter: require('eslint-friendly-formatter')
                }
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: vueLoaderConfig
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                include: [resolve('src'), resolve('test')]
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'url-loader',
                query: {
                    limit: 10000,
                    name: utils.assetsPath('img/[name].[hash:7].[ext]')
                }
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                loader: 'url-loader',
                query: {
                    limit: 10000,
                    name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
                }
            }
        ]
    }
};
