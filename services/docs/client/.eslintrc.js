const path = require('path');


module.exports = {
  "extends": [
    "eslint-config-t14n-client",
    "plugin:react/recommended",
    "plugin:import/recommended"
  ],
  "plugins": ["react", "import"],
  "env": {
    "browser": true
  },
  "settings": {
    "import/resolver": {
      "webpack": {
        config: path.join(__dirname, 'webpack.aliases.js')
      }
    }
  },
  "rules": {
    "react/no-unknown-property": [2, {"ignore": ["class"]}],
    "react/self-closing-comp": [2, {"component": true, "html": false}],
    "react/jsx-uses-vars": "error",
    "react/jsx-uses-react": "error",
    "react/prop-types": 0,
    "class-methods-use-this": ["error", {
      "exceptMethods": [
        "render",
        "getInitialState",
        "getDefaultProps",
        "componentWillMount",
        "componentDidMount",
        "componentWillReceiveProps",
        "shouldComponentUpdate",
        "componentWillUpdate",
        "componentDidUpdate",
        "componentWillUnmount"
      ]
    }]
  },
};
