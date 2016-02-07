'use strict';
var yeoman = require('yeoman-generator');

function includes(arr, value) {
	return arr.indexOf(value) !== -1;
}

module.exports = yeoman.Base.extend({
	constructor: function () {
		yeoman.Base.apply(this, arguments);

		this.argument('hints', {
			type: Array,
			required: false,
			desc: 'Hints for the prompt such as [es2015, stage-2, react, rollup, node4, polyfill, runtime, register, cli, core]',
			default: []
		});
	},

	initializing: function () {
		this.babelrcFile = '.babelrc';

		if (this.fs.exists('.babelrc.json')) {
			this.babelrc = this.fs.readJSON('.babelrc.json');
			this.babelrcFile = '.babelrc.json';
		} else {
			this.babelrc = this.fs.readJSON('.babelrc', {});
		}

		var filterRules = function (isArray, list, rules) {
			var values = [];

			rules.forEach(function (arg) {
				var test = arg[0];
				var repl = arg[1];

				list.forEach(function (value) {
					if (test instanceof RegExp) {
						var m = test.exec(value);
						if (m) {
							values.push((repl || '$0').replace(/\$(\d)/g, function (_, d) {
								return m[d];
							}));
						}
					} else if (value === test) {
						values.push(repl || value);
					}
				});
			});

			return isArray ? values : values[0];
		};

		var guessState = function (prop, rules) {
			var isArray = /\*$/.test(prop);
			prop = prop.replace(/\*$/, '');
			var current = this.babelrc[prop] || [];

			return filterRules(isArray, current, rules);
		}.bind(this);

		var checkHint = function (isArray, rules) {
			return filterRules(isArray, this.hints, rules);
		}.bind(this);

		this.babelState = {
			languageLevel: guessState('presets', [
				[/^stage-\d$/],
				[/^es2015-?/, 'es2015']
			]),
			transpileTarget: guessState('presets', [
				['es2015'],
				[/^es2015-(.+)$/]
			]),
			additionalSyntaxes: guessState('presets*', [
				['react']
			]),
			polyfill: guessState('plugins', [['transform-runtime']]),
			usage: guessState('presets*', [
				[/^babel-(register|cli|core)$/]
			])
		};

		this.promptHints = {
			languageLevel: checkHint(false, [
				[/^stage-\d$/],
				['es2015']
			]),
			transpileTarget: checkHint(false, [
				['es2015'],
				[/^(rollup|node[4-5])$/, 'es2015-$1']
			]),
			additionalSyntaxes: checkHint(true, [
				['react']
			]),
			polyfill: checkHint(false, [
				['polyfill', 'babel-polyfill'],
				[/^(transform-)?runtime$/, 'transform-runtime']
			]),
			usage: checkHint(true, [
				['register', 'babel-register'],
				[/^(cli|repl)$/, 'babel-cli'],
				['core', 'babel-core']
			])
		};
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
				default: this.promptHints.languageLevel || this.babelState.languageLevel || 'es2015'
			},
			{
				type: 'list',
				name: 'transpileTarget',
				message: 'Transpilation target',
				choices: [
					{value: 'es2015', name: 'es5'},
					{value: 'es2015-rollup', name: 'rollup'},
					{value: 'es2015-node4', name: 'node4'},
					{value: 'es2015-node5', name: 'node5'}
				],
				default: this.promptHints.transpileTarget || this.babelState.transpileTarget || 'es2015'
			},
			{
				type: 'checkbox',
				name: 'additionalSyntaxes',
				message: 'Additional syntaxes',
				choices: [
					'react'
				],
				default: [].concat(this.promptHints.additionalSyntaxes, this.babelState.additionalSyntaxes)
			},
			{
				type: 'list',
				name: 'polyfill',
				message: 'Polyfill or runtime',
				choices: [
					{value: false, name: 'none'},
					'babel-polyfill',
					'transform-runtime'
				],
				default: this.promptHints.polyfill || this.babelState.polyfill || false
			},
			{
				type: 'checkbox',
				name: 'usage',
				message: 'How will babel be used?',
				choices: [
					{value: 'babel-register', name: '`require("babel-register")();` require hook'},
					{value: 'babel-cli', name: '`babel` cli command / `babel-node` repl'},
					{value: 'babel-core', name: 'custom transformation with `babelCore.transform(code, options);`'}
				],
				default: [].concat(this.promptHints.usage, this.babelState.usage)
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
		presets.push(this.answers.transpileTarget);

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
			return !includes(presets, preset) &&
				!/^es2015(-.+)?$/.test(preset) &&
				!/^stage-\d$/.test(preset);
		});
		this.babelrc.plugins = (this.babelrc.plugins || []).filter(function (plugin) {
			return !includes(plugins, plugin);
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

		var babelrc = JSON.stringify(this.babelrc, null, 2)
			.replace(/\[(,?\s*"[-a-z0-9]+")+\s*\]/ig, function (m) {
				return m.replace(/\s+/g, ' ').replace(/^\[ /, '[').replace(/ \]$/, ']');
			});
		this.fs.write(this.babelrcFile, babelrc + '\n');
	},

	install: function () {
		// Make sure that if package.json has not been initialized we at least actually save the deps
		if (!this.fs.exists('package.json')) {
			this.fs.writeJSON('package.json', {});
		}

		this.npmInstall(this.devDeps, {saveDev: true});
	}
});
