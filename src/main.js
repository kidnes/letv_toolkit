/**
 * @file 构建工具主文件
 * @desc 支持打包和本地调试，配置文件config.js，
 *	命令行指明相关参数，则以命令行为准，否则以配置文件为准
 *	使用方法：
 *			server lejs		//本地开发lejs
 *			server			//本地开发
 *			build lejs 1010
 *			build lejs
 *			build 
 *			build trunk lejs 1010	//强制使用trunk打包，防止不小心从branches打包，
 *									正式上线时，请使用
 * @author liubin
 */

var	project = require("./modules/project"),
	depends = require("./modules/depends"),
	jshint = require("./modules/hint"),
	svn = require("./modules/svn"),
	logo = require("./modules/logo"),
	fs = require('fs'),
	path = require('path');

var projectConfig, pkgConfig;

function parseArgvs($argvs) {
	if (!$argvs) return;

	if (!fs.existsSync(pkgConfig.root)) {
		var root = path.resolve(__dirname+'/../../../');
		pkgConfig.root = root + '/src/';
	}

	var VER_RE = /\s*(\d{3,6})[\s\n\r]*/,
		PRO_RE = /\s*([^trunk]\w+)/g, 
		result; 

	var cmd = $argvs.join(' ');

	if (/--\btrunk\b/i.test(cmd) || /-\bt\b/i.test(cmd)) {	//解析-t 或 --trunk参数
		pkgConfig.isTrunk = true;
	}

	if (/--\bhint\b/i.test(cmd)) {	//解析-h 或 --hint参数
		jshint.hintLevel(0);
	}

	if (/--\bhelp\b/i.test(cmd) || /-\bh\b/i.test(cmd)) {	//解析-h 或 --help参数
		var content = require('./modules/help.js').help();
		console.log(content);
		return true;
	}

	if (/--\blocal\b/i.test(cmd) || /-\bl\b/i.test(cmd)) {	//解析-l 或 --local参数
		pkgConfig.isLocal = true;
	}

	
	if (cmd.match(VER_RE)) {	//解析版本号参数
		pkgConfig.projectVersion = RegExp.$1;
	}

	while ((result = PRO_RE.exec(cmd)) !== null) {
		if (fs.existsSync(pkgConfig.root+'/'+result[1])) {
			pkgConfig.project = result[1];
			break;
		}
	}
}

function init() {

	project.init(pkgConfig);

	var projects = project.getProject();

	projectConfig = projects[pkgConfig.project];

	var file = require("./modules/file");
	file.init(projects, pkgConfig);

	return depends.init(projectConfig);
}

function build($argvs) {
	pkgConfig.isBuild = true;

	if (parseArgvs($argvs)) return;

	jshint.init($argvs, 2);

	var fileMap = init($argvs);

	var compress = require('./modules/compress'); //压缩文件
	compress.init(pkgConfig, projectConfig, fileMap);
}

function server($argvs, config) {
	pkgConfig = config;
	pkgConfig.isBuild = false;

	if (parseArgvs($argvs)) return;

	init($argvs);

	var server = require('./modules/server'); //本地服务器文件
	server.start(pkgConfig);
}

function hint($argvs) {
	console.log(logo.LTKLogo());

	if (parseArgvs($argvs)) return;

	jshint.init($argvs, 1);

	init($argvs);
}

function socket($argvs) {
	var socket = require('./modules/socket');
	socket.init(pkgConfig);
}

function release($argvs) {
	console.log(logo.LTKLogo());

	if (parseArgvs($argvs)) return;

	pkgConfig.isRelease = true;

	build($argvs);
}

function deploy($argvs, config) {
	console.log(logo.LTKLogo());
	pkgConfig = config;
	pkgConfig.isDeploy = true;

	if (parseArgvs($argvs)) return;

	svn.updateSVN(function(){
		build($argvs);
	});
}

function getConfig() {
	return projectConfig;
}

exports.build 	= build;
exports.server 	= server;
exports.hint = hint;
exports.socket = socket;
exports.release = release;
exports.deploy = deploy;
exports.getConfig = getConfig;