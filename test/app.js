'use strict';
var path = require('path');
var fs = require('fs');
var fmt = require('util').format;
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');

describe('generator-babel-init:app', function () {
	testRun({
		prompts: {
			languageLevel: 'es2015',
			transpileTarget: 'es5',
			additionalSyntaxes: ['react'],
			polyfill: false,
			usage: ['babel-register', 'babel-node']
		},
		presets: ['es2015', 'react'],
		plugins: undefined,
		devDeps: ['babel-register', 'babel-node', 'babel-preset-es2015', 'babel-preset-react']
	});

	testRun({
		prompts: {
			languageLevel: 'stage-2',
			transpileTarget: 'es5',
			additionalSyntaxes: [],
			polyfill: 'babel-polyfill',
			usage: ['babel-cli']
		},
		presets: ['es2015', 'stage-2'],
		plugins: undefined,
		devDeps: ['babel-cli', 'babel-polyfill', 'babel-preset-es2015', 'babel-preset-stage-2']
	});

	testRun({
		prompts: {
			languageLevel: 'stage-0',
			transpileTarget: 'node4',
			additionalSyntaxes: [],
			polyfill: 'transform-runtime',
			usage: ['babel-core']
		},
		presets: ['es2015-node4', 'stage-0'],
		plugins: ['transform-runtime'],
		devDeps: ['babel-core', 'babel-preset-es2015-node4', 'babel-preset-stage-0', 'babel-plugin-transform-runtime']
	});

	function testRun(opts) {
		var testName = fmt(
			'%s > %s > [%s] > %s > [%s]',
			opts.prompts.languageLevel,
			opts.prompts.transpileTarget,
			(opts.prompts.additionalSyntaxes || []).join(', '),
			opts.prompts.polyfill,
			(opts.prompts.usage || []).join(', ')
		);

		describe(testName, function () {
			var runCtx;
			before(function (done) {
				this.timeout(10000);
				runCtx = helpers.run(path.join(__dirname, '../generators/app'))
					.withPrompts(opts.prompts)
					.on('end', done);
			});

			it('creates babelrc', function () {
				assert.file(['.babelrc']);
				var babelrc = JSON.parse(fs.readFileSync('.babelrc', 'utf8'));
				assert.deepEqual(babelrc.presets, opts.presets);
				assert.deepEqual(babelrc.plugins, opts.plugins);
			});

			it('installs dev dependencies', function () {
				assert.deepEqual(runCtx.generator.devDeps, opts.devDeps);
			});
		});
	}
});
