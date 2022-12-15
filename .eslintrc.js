module.exports = {
  'root': true
  , 'env': {
    'node': true
  }
  , 'extends': [
    'plugin:vue/essential'
    , '@vue/standard'
  ]
  , 'rules': {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    , 'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    , 'generator-star-spacing': 'off'
    , 'comma-style': [
      0
      , 'first'
    ]
    , 'space-in-parens': 0
    , 'space-before-blocks': 0
    , 'padded-blocks': 0
    , 'space-before-function-paren': 0
  }
  , 'parserOptions': {
    'parser': 'babel-eslint'
  }
}
