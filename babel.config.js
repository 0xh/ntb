module.exports = function babelConfig(api) {
  api.cache(true);

  return {
    sourceMaps: 'inline',
    retainLines: true,
    presets: [
      ['@babel/env', { targets: { node: 'current' } }],
    ],
    plugins: [
      '@babel/plugin-proposal-class-properties',
    ],
  };
};
