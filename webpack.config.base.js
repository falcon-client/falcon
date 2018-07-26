/**
 * Base webpack config used across other specific configs
 */

import path from 'path';
import webpack from 'webpack';
import LodashModuleReplacementPlugin from 'lodash-webpack-plugin';
import HardSourceWebpackPlugin from 'hard-source-webpack-plugin';
import { dependencies as externals } from './app/package.json';

export default {
  mode: 'development',

  externals: [
    ...Object.keys(externals || {}),
    'pg-native',
    'sqlite3',
    // '@falcon-client/falcon-core',
    'better-sqlite3',
    'pg-hstore',
    'bindings'
  ],

  module: {
    // Disable handling of requires with a single expression
    exprContextRegExp: /$^/,
    exprContextCritical: false,
    // Disable handling of requires with expression wrapped by string,
    wrappedContextRegExp: /$^/,
    wrappedContextCritical: false,

    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true
            }
          }
        ]
      },
      {
        test: /\.worker\.js$/,
        use: [{ loader: 'worker-loader' }]
      },
      {
        test: /aws-sdk/,
        loaders: ['transform-loader?brfs']
      }
    ]
  },

  output: {
    path: path.join(__dirname, 'app'),
    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2',
    globalObject: 'this'
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    mainFields: ['module', 'main', 'browser'],
    extensions: ['.mjs', '.js', '.jsx', '.json'],
    modules: [path.join(__dirname, 'app'), 'node_modules'],
    alias: {
      '@falcon-client/graphql-voyager': path.resolve(
        __dirname,
        'packages/graphql-voyager'
      ),
      '@falcon-client/react-clipboard.js': path.resolve(
        __dirname,
        'packages/react-clipboard.js'
      ),
      '@falcon-client/svg-pan-zoom': path.resolve(
        __dirname,
        'packages/svg-pan-zoom'
      ),
      '@falcon-client/svg-zoom': path.resolve(__dirname, 'packages/svg-zoom'),
      '@falcon-client/falcon-core': path.resolve(
        __dirname,
        'packages/falcon-core'
      ),
      '@falcon-client/falcon-ui': path.resolve(__dirname, 'packages/falcon-ui')
    }
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production'
    }),
    new LodashModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.IgnorePlugin(/^mock-firmata$/),
    new webpack.ContextReplacementPlugin(/bindings$/, /^$/)
    // new HardSourceWebpackPlugin(),
    // {
    //   apply(compiler) {
    //     function setModuleConstant(expressionName, fn) {
    //       compiler.parser.plugin(
    //         `expression ${expressionName}`,
    //         function plugin() {
    //           this.state.current.addVariable(
    //             expressionName,
    //             JSON.stringify(fn(this.state.module))
    //           );
    //           return true;
    //         }
    //       );
    //     }
    //     setModuleConstant('__filename', module => module.resource);
    //     setModuleConstant('__dirname', module => module.context);
    //   }
    // }
  ]
};
