module.exports = function babelConfig(api) {
  api.cache(true);

  return {
    sourceMaps: 'inline',
    retainLines: true,
    presets: [
      ['@babel/env', { targets: { node: 'current' } }],
      '@babel/typescript',
    ],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/plugin-proposal-class-properties',
    ],
  };
};
