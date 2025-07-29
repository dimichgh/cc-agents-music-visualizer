const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  target: 'electron-main',
  entry: './src/main/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'main.js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.main.json',
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/main': path.resolve(__dirname, 'src/main'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  externals: {
    electron: 'commonjs2 electron',
  },
  devtool: process.env.NODE_ENV === 'development' ? 'source-map' : false,
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
  },
};