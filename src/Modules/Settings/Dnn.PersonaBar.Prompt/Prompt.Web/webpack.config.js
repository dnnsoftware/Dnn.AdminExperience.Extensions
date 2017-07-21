var path = require('path'),
    webpack = require('webpack'),
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const packageJson = require("./package.json");
const isProduction = process.env.NODE_ENV === "production";


module.exports = {
    context: path.resolve(__dirname, '.'),
    entry: "./src/app.js",
    output: {
        path: path.resolve(__dirname, '../admin/personaBar/scripts/bundles/'),
        filename: 'prompt-bundle.js'
    },
    devtool: '#source-map',
    devServer: {
        contentBase: `${__dirname}/src/`,
        publicPath: '/dist/',
    },

    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel-loader',
            options: {
                presets: ['es2015']
            }
        },
        {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract({ use: 'css-loader' })
        }]
    },
    resolve: {
        extensions: [".js", ".json", ".jsx"]
    },
    externals: {
        'jquery': 'jQuery'
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery'
        }),

        //new webpack.optimize.UglifyJsPlugin({
        //    compress: { warnings: false }
        //}),
        new ExtractTextPlugin('../../css/Prompt.css'),
        new OptimizeCssAssetsPlugin({
            assetNameRegExp: /\.css$/g,
            cssProcessor: require('cssnano'),
            cssProcessorOptions: { discardComments: { removeAll: true } },
            canPrint: true
        })
    ]
}