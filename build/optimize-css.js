const webpackSources = require('webpack-sources');

// 插件构造函数
function OptimizeCssAssetsPlugin(options) {
    this.options = options || {};

    if (this.options.assetNameRegExp === undefined) {
        this.options.assetNameRegExp = /\.css$/g;
    }

    if (this.options.cssProcessor === undefined) {
        this.options.cssProcessor = require('cssnano');
    }

    if (this.options.cssProcessorOptions === undefined) {
        this.options.cssProcessorOptions = {};
    }

    if (this.options.canPrint === undefined) {
        this.options.canPrint = true;
    }
}

// 插件原型函数
Object.assign(OptimizeCssAssetsPlugin.prototype, {
    print() {
        if (this.options.canPrint) {
            console.log.apply(console, arguments);
        }
    },
    processCss(css, assetName) {
        const opt = Object.assign({ to: assetName }, this.options.cssProcessorOptions);
        return this.options.cssProcessor.process(css, opt);
    },
    createCssAsset(css, originalAsset) {
        return new webpackSources.RawSource(css);
    },
    apply(compiler) {
        compiler.plugin('emit', (compilation, finish) => {
            const assets = compilation.assets,
                cssAssetNames = Object.keys(assets).filter((name) => name.match(this.options.assetNameRegExp));

            Promise.all(cssAssetNames.map((assetName) =>
                this.processCss(assets[assetName].source(), assetName)
                    .catch((err) => {
                        this.print('Error processing file: ' + assetName);
                        throw err;
                    })
            ))
                .then(() => finish())
                .catch(finish);
        });
    },
});

module.exports = OptimizeCssAssetsPlugin;
