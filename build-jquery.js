"use strict";

// Full jQuery build: the same requirejs.optimize config as build/tasks/build.js
// for `grunt build:*:*` (no module exclusions), then the Gruntfile uglify options.
const fs = require("fs");
const path = require("path");
const requirejs = require("requirejs");
const uglify = require("uglify-js");

const root = process.argv[2];
const destDir = process.argv[3];
if (!root || !destDir) {
	console.error("usage: node build-jquery.js SRCDIR DESTDIR");
	process.exit(2);
}

const srcFolder = path.join(root, "src") + path.sep;
const version = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
const rdefineEnd = /\}\s*?\);[^}\w]*$/;

function read(fileName) {
	return fs.readFileSync(srcFolder + fileName, "utf8");
}

const wrapper = read("wrapper.js").split(/[\x20\t]*\/\/ @CODE\n(?:[\x20\t]*\/\/[^\n]+\n)*/);

function convert(name, modulePath, contents) {
	if (/.\/var\//.test(modulePath.replace(process.cwd(), ""))) {
		contents = contents
			.replace(
				/define\(\s*(["'])[\w\W]*?\1[\w\W]*?return/,
				"var " + (/var\/([\w-]+)/.exec(name)[1]) + " ="
			)
			.replace(rdefineEnd, "");
	} else {
		contents = contents
			.replace(/\s*return\s+[^\}]+(\}\s*?\);[^\w\}]*)$/, "$1")
			.replace(/\s*exports\.\w+\s*=\s*\w+;/g, "");
		contents = contents
			.replace(/define\([^{]*?{\s*(?:("|')use strict\1(?:;|))?/, "")
			.replace(rdefineEnd, "");
		contents = contents
			.replace(/\/\*\s*ExcludeStart\s*\*\/[\w\W]*?\/\*\s*ExcludeEnd\s*\*\//ig, "")
			.replace(/\/\/\s*BuildExclude\n\r?[\w\W]*?\n\r?/ig, "");
		contents = contents
			.replace(/define\(\s*\[[^\]]*\]\s*\)[\W\n]+$/, "");
	}
	return contents;
}

const config = {
	baseUrl: path.join(root, "src"),
	name: "jquery",
	useStrict: true,
	optimize: "none",
	findNestedDependencies: true,
	skipModuleInsertion: true,
	skipSemiColonInsertion: true,
	wrap: {
		start: wrapper[0].replace(/\/\*\s*eslint(?: |-).*\s*\*\/\n/, ""),
		end: wrapper[1]
	},
	rawText: {},
	onBuildWrite: convert,
	out: function(compiled) {
		compiled = compiled
			.replace(/@VERSION/g, version)
			.replace(/@DATE/g, "SOURCE-BUILD");
		fs.mkdirSync(destDir, { recursive: true });
		const full = path.join(destDir, "jquery.js");
		fs.writeFileSync(full, compiled);
		const minified = uglify.minify(compiled, {
			output: {
				ascii_only: true,
				ie8: true,
				comments: false
			},
			compress: {
				hoist_funs: false,
				loops: false,
				typeofs: false
			}
		});
		if (minified.error) {
			throw minified.error;
		}
		const banner = "/*! jQuery v" + version + " | (c) OpenJS Foundation and other contributors | jquery.org/license */\n";
		fs.writeFileSync(path.join(destDir, "jquery.min.js"), banner + minified.code + "\n");
		console.log("wrote", full, compiled.length, "min", minified.code.length);
	}
};

requirejs.optimize(config, function(response) {
	console.log(String(response).split("\n")[0]);
}, function(err) {
	console.error(err);
	process.exit(1);
});
