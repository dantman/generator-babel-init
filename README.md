# generator-babel-init [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
Initialize babel in your project, tailored to your needs.

## Installation

First, install [Yeoman](http://yeoman.io) and generator-babel-init using [npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)).

```bash
npm install -g yo
npm install -g generator-babel-init
```

Then initialize babel in your project using:

```bash
yo babel-init
```

You'll be asked what ECMAScript level you want to transpile (es2015, stage-#), what target you are transpiling to (es5, node4, node5, rollup), what additional syntaxes you'll be using (just react for now), if and how you want to polyfill the environment (none, babel-polyfill, or transform-runtime), and how you intend to use babel.

generator-babel-init will then setup your `.babelrc` and install the necessary npm packages.

## License

MIT © [Daniel Friesen](http://danielfriesen.name/)


[npm-image]: https://badge.fury.io/js/generator-babel-init.svg
[npm-url]: https://npmjs.org/package/generator-babel-init
[travis-image]: https://travis-ci.org/dantman/generator-babel-init.svg?branch=master
[travis-url]: https://travis-ci.org/dantman/generator-babel-init
[daviddm-image]: https://david-dm.org/dantman/generator-babel-init.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/dantman/generator-babel-init
