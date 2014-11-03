/**
 * @file 压缩文件
 * @desc 文件内容已加载，生成压缩文件
 *			建议使用uglifyJS压缩，
 *			它可以构建AST（Abstract Syntax Tree）代码结构，保证代码没有语法错误
 * @author liubin
 */

var exec = require('child_process').exec, fs = require('fs'), 
	http = require("http"),
	crypto = require('crypto'), pkgConfig,
	currPro, verTag, verInfo, verDate, zip,
	distAll, distMin, distLine, distTag,
	compressList = [], starttime,
	count =0, total =0;

function init(pConfig, proConfig, pFileMap) {
	pkgConfig 	= pConfig;
	currPro 	= proConfig;
	fileMap 	= pFileMap;

	createVerInfo();

	checkDir();

	createFile();
}

function createVerInfo() {
	var t = new Date(), 
		y = t.getFullYear(), m = t.getMonth()+1, d = t.getDate(),
		h = t.getHours(), mm = t.getMinutes();

	verInfo = 'lejs_' + (pkgConfig.projectVersion || '' + (h>=10 ? h : '0'+h) + (mm>=10 ? mm : '0'+mm));
	verTag = [y, (m>=10 ? m : '0'+m), '/', (d>=10?d:'0'+d), '/', verInfo, '/'].join('');
	verDate = [y, (m>=10 ? m : '0'+m), (d>=10?d:'0'+d)].join('');

	//生成压缩文档
	// zip = require('archiver')('zip');
	// zip.on('error', function(err){
	// 	console.log('\n[E003] 生成zip压缩包的过程中出现异常！');
	// 	throw err;
	// });
}

function checkDir() {
	var dist = currPro.dist;
	distAll = dist + 'all/';
	distMin = dist + 'min/';
	distLine = dist + 'goline/';
	distDate = distLine + verDate + '/';
	distTag = distDate + verInfo + '/';

	fs.existsSync(distAll) || fs.mkdirSync(distAll);
	fs.existsSync(distMin) || fs.mkdirSync(distMin);
	fs.existsSync(distLine) || fs.mkdirSync(distLine);
	fs.existsSync(distDate) || fs.mkdirSync(distDate);
	fs.existsSync(distTag) || fs.mkdirSync(distTag);

	fs.readdirSync(distAll).forEach(function(file){
		fs.unlinkSync(distAll+file);
	});

	fs.readdirSync(distMin).forEach(function(file){
		fs.unlinkSync(distMin+file);
	});
}

function createFile() {
	var cmd = 'uglifyjs {tmp} -m -o {dist}';

	starttime = new Date().getTime();
	compressList = [];
	var processCount = 0, cpuCount = require('os').cpus().length;

	console.log('=== 正在合并文件 ...');

	for (var file in fileMap) {
		// console.log('正在合并和压缩文件 : ' +file+' ==> ' + writeCount++);
		// fs.writeFileSync(distAll+file, fileMap[file], {encoding: pkgConfig.charset});

		// compressList.push({'cmd':cmd.replace(/{tmp}/, distAll+file).replace(/{dist}/, distMin+file), 'file':file});

		total++;
		(function(file) {
			fs.writeFile(distAll+file, fileMap[file], {encoding: pkgConfig.charset}, function(err){
				
				compressList.push({'cmd':cmd.replace(/{tmp}/, distAll+file).replace(/{dist}/, distMin+file), 'file':file});

				if (processCount++ < cpuCount) compress();
			});
		})(file);
	}

	// while (cpuCount-- >=0) compress();
}

function compress() {
	if (compressList.length === 0) return;

	var obj = compressList.shift();

	exec(obj.cmd, function(err){
		console.log('正在压缩文件 : ' + obj.file + ' ==> ' + (total - count++));

		if (err) {
			console.log('文件压缩错误:'+obj.file+' :: '+err);
			process.exit(1); 
		}
		
		compress();

		if (total == count) compressFinish();
	});
}

function compressFinish() {
	getAbcContent();

	if (pkgConfig.clean) {
		fs.readdirSync(distAll).forEach(function(file){
			fs.unlinkSync(distAll+file);
		});
		fs.rmdir(distAll, function(err){
			console.log('清理完成！');
		});
	}
}

function complete(){
	console.log('打包完成！\n共用时：'+(new Date().getTime()-starttime)/1000 +' 秒');

	if (pkgConfig.isRelease || pkgConfig.isDeploy) {
		var release = require('./release'),
			fileName = verInfo + '.zip',
			path = distLine + fileName;
		setTimeout(function(){
			release.init(distTag, verInfo);
		}, 1000);
	}
}

function getAbcContent() {
	if (pkgConfig.isLocal) {	//使用本地的abc文件
		var path = require('path'),
            dir = path.resolve(__dirname + '/..');
            
        if (fs.existsSync(dir + '/abc.js')) {
            var content = fs.readFileSync(dir + '/abc.js', 'utf8');
            
            console.log('=== 正在使用本地abc版本文件 ...');

            updateABC(content);

            complete();
            return;
        }
	}

	requestPage(currPro.abcversion, function(data, res) {
		var reg = /js.letvcdn.com\/js\/\d+\/\d+\/lejs_\d+\/abc[_\w+]*\.js/i,
			result = data.match(reg);

		if (result) {
			requestPage(result[0], function(data, res) {
				updateABC(data);

				complete();
			});
		} else {
			console.log('请检测package.js配置项中的abcversion参数对应的URL地址，是否存在abc路径。');
			process.exit(1);
		}
	});
}

function requestPage(url, callback) {
    http.get(parseUrl(url), function(res) {

        res.setEncoding('utf8');
        var data = '';

        res.on('data', function(chunk) {
            data += chunk.toString();
        });
        res.on('end', function() {
            if (typeof callback == 'function') callback(data, res);
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}

function parseUrl(url) {
	if (!/:\/\//.test(url)) return 'http://' + url;
	return url;
}

function updateABC(abc) {
	var distFiles = {}, content;

	var r = abc.split('/*<VER>*/');
	if (r.length<3) {
		console.log('abc文件内容不正确。');
		process.exit(1);
		return;
	}
	
	content = r[1];

	var vers = JSON.parse('{'+content.replace(/\/\*.+\*\//mg, '').replace(/^[\s\n\r]+/,'').replace(/,[\s\n\r]*$/, '')+'}');
	
	fs.readdirSync(distMin).forEach(function(file){
		if (/\.js$/.test(file)) {
			content = fs.readFileSync(distMin+'/'+file,'utf8');
			distFiles[file.replace(/\.js$/, '')] = {'name': file, 'md5':crypto.createHash('md5').update(content).digest('hex').substring(0,7), 'content': content};
		}
	});

	var abcArr = [], golineArr = [], temp;
	for (var file in distFiles) {
		temp = '"'+file+'": "'+verTag+'|'+distFiles[file].md5+'",';
		if (vers[file] && vers[file].indexOf(distFiles[file].md5) == -1) {
			abcArr.push(temp+' /*u*/');
			golineArr.push(file);
		} else if (!vers[file]) {
			abcArr.push(temp+' /*n*/');
			golineArr.push(file);
		} else {
			abcArr.push('"'+file+'": "'+vers[file]+'",');
		}
	}

	for (var file in vers) {
		if (!distFiles[file]) {
			abcArr.push('/*"' + file+'": "' + vers[file]+'", del*/');
			console.log('请注意有main文件被删除：'+file);
		}
	}

	abcArr.sort();

	content = '\n';
	for (var i = 0; i < abcArr.length; i++) {
		content += abcArr[i] + '\n';
	}

	r[1] = content;

	var abcName = 'abc_' + currPro.name + '.js';
	fs.writeFile(distMin+abcName, r.join('/*<VER>*/'), {encoding : pkgConfig.charset});
	fs.writeFile(distTag+abcName, r.join('/*<VER>*/'), {encoding : pkgConfig.charset});

	// if (pkgConfig.isRelease || pkgConfig.isDeploy)
	// 	fs.writeFile(currPro.base + 'trunk/src/abc123_' + currPro.name + '.js', r.join('/*<VER>*/'), {encoding : pkgConfig.charset});

	for (var i = 0; i < golineArr.length; i++) {
		var file = distFiles[golineArr[i]];
		fs.writeFile(distTag+file.name, file.content, {encoding : pkgConfig.charset});
	}
}

exports.init = init;