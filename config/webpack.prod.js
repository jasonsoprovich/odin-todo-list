const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = (env, argv) =>
  merge(common(env, argv), {
    mode: 'production',
    devtool: 'source-map',
    output: {
      publicPath: './',
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true,
          },
        },
      },
    },
  });
