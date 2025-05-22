const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = (env, argv) =>
  merge(common(env, argv), {
    mode: 'development',
    devtool: 'inline-source-map',
    output: {
      publicPath: '/',
    },

    devServer: {
      hot: true,
      open: true,
      watchFiles: ['src/**/*'],
      client: {
        overlay: true,
      },
    },
  });
