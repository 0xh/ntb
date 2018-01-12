const jestBase = require('../../jest.config.js')


module.exports = {
  ...jestBase,
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    }
  },
  browser: true,
  setupFiles: [
    '<rootDir>/../../tests-setup/polyfill.js',
    '<rootDir>/../../tests-setup/setup.js'
  ]
}
