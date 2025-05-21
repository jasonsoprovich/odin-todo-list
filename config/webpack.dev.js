const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

module.exports = (env, argv) =>
  merge(common(env, argv), {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
      static: {
        directory: path.resolve(__dirname, '../dist'),
      },
      hot: true,
      open: true,
      watchFiles: ['src/**/*'],
      client: {
        overlay: true, // show compile errors in browser
      },
    },
  });
