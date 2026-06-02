const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')
const fs = require('fs')

// Load .env manually (dotenv not installed; keep it simple)
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env')
  if (!fs.existsSync(envPath)) return {}
  return Object.fromEntries(
    fs.readFileSync(envPath, 'utf8')
      .split('\n')
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => {
        const [k, ...rest] = l.split('=')
        return [k.trim(), rest.join('=').trim()]
      })
  )
}

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production'
  const envVars = loadEnv()

  return {
    entry: './src/main.jsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProd ? '[name].[contenthash].js' : 'bundle.js',
      clean: true,
      publicPath: '/',
    },
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.css$/,
          use: [
            isProd ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader',
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: './index.html', inject: 'body' }),
      new webpack.DefinePlugin(
        Object.fromEntries(
          Object.entries({ ...envVars, ...process.env })
            .filter(([k]) => k.startsWith('VITE_'))
            .map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)])
        )
      ),
      ...(isProd ? [new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' })] : []),
    ],
    devServer: {
      historyApiFallback: true,
      port: 5173,
      hot: true,
      open: true,
    },
    devtool: isProd ? 'source-map' : 'cheap-module-source-map',
  }
}
