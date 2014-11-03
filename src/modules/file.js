/**
 * @file 解析文件
 * @desc 传入Main目录下文件名，返回合并后文件
 *      __req('lib::jquery/jquery-1.7.1.js')        //指定加载lib项目jquery,当前项目必须依赖于lib
 * @author liubin
 */
 
var fs = require('fs'),
    parser = require('./LTKParse'),
    hint = require('./hint');

var currPro, defaultPro, projects, config, moduleList, notExistList, currPath = __dirname;

var r_req = /^[ \t]*\b__req\b\((['"])([^'"]*)\1.+$/mg;

function load(combineFile, pro) {
    currPro = pro;

	moduleList = {};
	notExistList = [];

	var content = '';
    
	if (currPro && currPro.main && fs.existsSync(currPro.main + combineFile)) {
		//return currPro.main;
		return parseReqFile(currPro.main + combineFile, currPro, combineFile);
	} else {
        if (currPro.depends) {
            for (var t in currPro.depends) {
                var item = currPro.depends[t];
                if (item.main && fs.existsSync(item.main + combineFile)) {
                    return parseReqFile(item.main + combineFile, item, combineFile);
                }
            }
        }
        
	}

    notExistList.push(combineFile);

	return content;
}

function parseReqFile(path, curr, currModule) {
    try {
        var file = fs.readFileSync(path, 'utf8');
    } catch(e) {
        console.log("文件不存在："+path);
        return;
        //process.exit(1); 
    }
	
    hint.hint(file, path);
    
    file = parser.parseLTK(file, currModule);
    file = "\n// " + path + '\n\n' + file;

    file = file.replace(r_req, function(all, quote, module) {
        if (module.slice(-3)!='.js') module += '.js';

        if (moduleList[curr.name+'::'+module]) return '';
        moduleList[curr.name+'::'+module] = true;

        if (fs.existsSync(curr.src + module)) { 	//解析当前目录下模块

            return parseReqFile(curr.src + module, curr, module);

        } else if (fs.existsSync(curr.main + module)) {

        	return parseReqFile(curr.main + module, curr, module);

        } else if (module.indexOf('::') >= 0) {			//根据项目名解析

        	var p = module.split('::');
            if (!curr.depends || !curr.depends[p[0]]) {
                console.log('请确认项目:'+curr.name+'，配置文件package.js中，依赖列表中是否存在：'+p[0] + '，文件：'+path);
                process.exit(0);
            }
            if (curr.depends[p[0]]) {
            	if (fs.existsSync(curr.depends[p[0]].src + p[1]))
            		return parseReqFile(curr.depends[p[0]].src + p[1], curr.depends[p[0]], p[1]);
            	else if (fs.existsSync(curr.depends[p[0]].main + p[1]))
            		return parseReqFile(curr.depends[p[0]].main + p[1], curr.depends[p[0]], p[1]);
                else {
                    console.log("文件未找到，请检查文件是否存在：" + curr.depends[p[0]].src + p[1] + " 或：" + curr.depends[p[0]].main + p[1]);
                    notExistList.push(module);
                    return '';
                }
            }

        } else {
        	
        	var depends = curr.depends;
            for (var item in depends) {		//解析当前依赖项目下模块，TODO：是否循环解析？
            	if (fs.existsSync(depends[item].src + module)) {

                    return parseReqFile(depends[item].src + module, depends[item], module);

                } else if (fs.existsSync(depends[item].main + module)) {
                	
                    return parseReqFile(depends[item].main + module, depends[item], module);
                }
            }

        }

        console.log("文件未找到，请检查文件是否存在：" + curr.src + module + " 或：" + curr.main + module);
        notExistList.push(module);
        return '';
    });
    return file;
}

function loadServerFile(combineFile) {
	if (/^abc[_\w+-]*\.js$/i.test(combineFile)) {
        var abcPath;
        if (fs.existsSync(defaultPro.root + 'abc.js')) {
            abcPath = defaultPro.root + 'abc.js';
        } else {
            var path = require('path'),
                dir = path.resolve(__dirname + '/..');

            if (fs.existsSync(dir + '/abc.js')) {
                abcPath = dir + '/abc.js';
            }
        }

        if (!abcPath) return 'alert("abc文件不存在")';
        
		return fs.readFileSync(abcPath, 'utf8');
	} else {
		var content = load(combineFile, defaultPro), notExist = '';

		for(var i=0, len = notExistList.length; i < len; i++) {
            console.log('File Not Exist：'+notExistList[i]);
			// notExist += "alert('File Not Exist："+notExistList[i]+"');\n";
		}

        parser.checkModule();

		return content;
	}
}

function init($projects, $config) {
    projects = $projects;
    config = $config;

    defaultPro = projects[config.project];
}

exports.init = init;
exports.load = load;
exports.loadServerFile = loadServerFile;
