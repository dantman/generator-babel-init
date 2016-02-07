'use strict';
var yeoman = require('yeoman-generator');

module.exports = yeoman.Base.extend({
	initializing: function () {
		this.babelrcFile = '.babelrc';

		if (this.fs.exists('.babelrc.json')) {
			this.babelrc = this.fs.readJSON('.babelrc.json');
			this.babelrcFile = '.babelrc.json';
		} else {
			this.babelrc = this.fs.readJSON('.babelrc', {});
		}
	},

	prompting: function () {
		var done = this.async();

		var prompts = [
			{
				type: 'list',
				name: 'languageLevel',
				message: 'ECMAScript language level',
				choices: [
					'es2015',
					'stage-3',
					'stage-2',
					'stage-1',
					'stage-0'
				],
				default: 'es2015'
			},
			{
				type: 'list',
				name: 'transpileTarget',
				message: 'Transpilation target',
				choices: [
					'es5',
					'rollup',
					'node4',
					'node5'
				]
			},
			{
				type: 'checkbox',
				name: 'additionalSyntaxes',
				message: 'Additional syntaxes',
				choices: [
					'react'
				]
			},
			{
				type: 'list',
				name: 'polyfill',
				message: 'Polyfill or runtime',
				choices: [
					{value: false, name: 'none'},
					'babel-polyfill',
					'transform-runtime'
				]
			},
			{
				type: 'checkbox',
				name: 'usage',
				message: 'How will babel be used?',
				choices: [
					{value: 'babel-register', name: '`require("babel-register")();` require hook'},
					{value: 'babel-cli', name: '`babel` cli command'},
					{value: 'babel-core', name: 'custom transformation with `babelCore.transform(code, options);`'},
					{value: 'babel-node', name: '`babel-node` repl'}
				]
			}
		];

		this.prompt(prompts, function (answers) {
			this.answers = answers;

			done();
		}.bind(this));
	},

	configuring: function () {
		var presets = [];
		var plugins = [];

		this.devDeps = [];

		// Always include es2015 or one of the alternatives
		presets.push(this.answers.transpileTarget === 'es5' ? 'es2015' : 'es2015-' + this.answers.transpileTarget);

		if (/^stage-\d$/.test(this.answers.languageLevel)) {
			presets.push(this.answers.languageLevel);
		}

		this.answers.additionalSyntaxes.forEach(function (preset) {
			presets.push(preset);
		});

		this.answers.usage.forEach(function (usage) {
			this.devDeps.push(usage);
		}.bind(this));

		switch (this.answers.polyfill) {
			case 'babel-polyfill':
				this.devDeps.push('babel-polyfill');
				break;
			case 'transform-runtime':
				plugins.push('transform-runtime');
				break;
			default:
				break;
		}

		this.babelrc.presets = (this.babelrc.presets || []).filter(function (preset) {
			return presets.indexOf(preset) !== -1 &&
				!/^es2015(-.+)?$/.test(preset) &&
				!/^stage-\d$/.test(preset);
		});
		this.babelrc.plugins = (this.babelrc.plugins || []).filter(function (plugin) {
			return plugins.indexOf(plugin) !== -1;
		});

		presets.forEach(function (preset) {
			this.babelrc.presets.push(preset);
			this.devDeps.push('babel-preset-' + preset);
		}.bind(this));
		plugins.forEach(function (plugin) {
			this.babelrc.plugins.push(plugin);
			this.devDeps.push('babel-plugin-' + plugin);
		}.bind(this));

		if (!this.babelrc.plugins.length) {
			delete this.babelrc.plugins;
		}

		this.fs.writeJSON(this.babelrcFile, this.babelrc);
	},

	install: function () {
		// Make sure that if package.json has not been initialized we at least actually save the deps
		if (!this.fs.exists('package.json')) {
			this.fs.writeJSON('package.json', {});
		}

		this.npmInstall(this.devDeps, {saveDev: true});
	}
});
