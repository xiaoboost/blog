const path = require('path'),
    utils = require('./utils'),
    webpack = require('webpack'),
    config = require('../config'),
    merge = require('webpack-merge'),
    // 基础配置
    baseWebpackConfig = require('./webpack.base.conf'),
    CopyWebpackPlugin = require('copy-webpack-plugin'),
    // webpack插件，用于生成html文件
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    // webpack插件，从文件中分离代码
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    // webpack插件，优化、最小化css文件
    // OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin'),
    OptimizeCSSPlugin = require('./optimize-css'),
    // 当前环境
    env = config.build.env;

// 将基础配置和当前配置合并
const webpackConfig = merge(baseWebpackConfig, {
    module: {
        // css的 loader
        rules: utils.styleLoaders({
            sourceMap: config.build.productionSourceMap,
            extract: true
        })
    },
    // 是否使用 #source-map
    devtool: config.build.productionSourceMap ? '#source-map' : false,
    output: {
        // 编译输出路径
        path: config.build.assetsRoot,
        // 编译输出文件名
        filename: utils.assetsPath('js/[name].[chunkhash].js'),
    },
    plugins: [
        // 给每个文件创建顶部注释
        new webpack.BannerPlugin({
            banner: 'Project: My Blog\nAuthor: 2015 - 2017 XiaoBoost\nfilename: [name], chunkhash: [chunkhash]\nReleased under the MIT License.',
        }),
        // http://vuejs.github.io/vue-loader/en/workflow/production.html
        new webpack.DefinePlugin({
            'process.env': env
        }),
        // js压缩插件
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            sourceMap: false
        }),
        // 从文件中分离css部分
        new ExtractTextPlugin({
            filename: utils.assetsPath('css/[name].[contenthash].css')
        }),
        // 压缩提取出来的css文本，这里将会把不同组件中重复的css合并
        new OptimizeCSSPlugin({
            cssProcessorOptions: {
                safe: true,
            },
        }),
        // 输出 index.html文件，你也可以通过编辑 index.html自定义输出，具体请参考下面的链接
        // https://github.com/ampedandwired/html-webpack-plugin
        new HtmlWebpackPlugin({
            filename: config.build.index,
            template: './src/index.html',
            inject: true,
            minify: {
                removeComments: true,
                collapseWhitespace: true,
                // 更多选项请参考下面的链接:
                // https://github.com/kangax/html-minifier#options-quick-reference
            },
            // necessary to consistently work with multiple chunks via CommonsChunkPlugin
            chunksSortMode: 'dependency'
        }),
        // 指定 common 文件
        new webpack.optimize.CommonsChunkPlugin({
            name: 'common',
            filename: 'js/common.[chunkhash].js',
        }),
        // copy custom static assets
        new CopyWebpackPlugin([{
            from: path.resolve(__dirname, '../static'),
            to: config.build.assetsSubDirectory,
            ignore: ['.*']
        }])
    ]
});

if (config.build.bundleAnalyzerReport) {
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
    webpackConfig.plugins.push(new BundleAnalyzerPlugin());
}

module.exports = webpackConfig;
