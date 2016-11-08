var path = require('path')
var webpack = require('webpack')

module.exports = {
    entry: './src/main.js',
    output: {
        // path: path.resolve(__dirname, './dist'),
        path: path.resolve(__dirname, './projects/tomahawk/dist'),
        // publicPath: '/dist/',
        publicPath: '/projects/tomahawk/dist/', //发布到github网页的有效路径
        filename: 'build.js'
    },
    resolveLoader: {
        root: path.join(__dirname, 'node_modules'),
    },
    module: {
        loaders: [
            {
                test: /\.vue$/,
                loader: 'vue'
            },
            {
                test: /\.js$/,
                loader: 'babel',
                exclude: /node_modules/
            },
            {
                test: /\.json$/,
                loader: 'json'
            },
            {
                test: /\.css$/, loader: 'style!css'
            },
            {
                test: /\.styl$/, loader: 'style-loader!css-loader!stylus-loader'
            },
            {
                test: /\.html$/,
                loader: 'vue-html'
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'url',
                query: {
                    limit: 10000,
                    name: '[name].[ext]?[hash]'
                }
            },
            { test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery' },
            { test: /\.(woff|woff2)$/,  loader: "url-loader?limit=10000&mimetype=application/font-woff" },
            { test: /\.ttf$/,    loader: "file-loader" },
            { test: /\.eot$/,    loader: "file-loader" }
        ]
        // ,resolve: {
        //     alias: {
        //         'd3': 'd3/build/d3.node.js'
        //     }
        // }
    },
    devServer: {
        historyApiFallback: true,
        noInfo: true
    },
    devtool: '#eval-source-map'
}

if (process.env.NODE_ENV === 'production') {
    module.exports.devtool = '#source-map'
    // http://vuejs.github.io/vue-loader/workflow/production.html
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
            warnings: false
            }
        }),
        new webpack.optimize.OccurenceOrderPlugin()
        // ,new webpack.ProvidePlugin({d3: 'd3'})
    ])
}
