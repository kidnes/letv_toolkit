/**
 * @file 解析文件依赖
 * @author liubin
 */

var fs = require('fs'), 
    file = require('./file'),
    parser = require('./LTKParse'),
    hint = require('./hint'),
    currPro;

function loadMain() {
    var mainPath = currPro.main, fileMap = {};
    if(!fs.existsSync(mainPath)) return;

    if (hint.hintLevel()>0) console.log("=== 正在检测代码错误 ...");
    else {
        console.log("=== 忽略错误代码检测 ...");
        return;
    }

    fs.readdirSync(mainPath).forEach(function(combineFile) {
        if (/[\w\.-]+\.js/.test(combineFile)) {
            fileMap[combineFile] = file.load(combineFile, currPro);
        }
    });

    for (var pro in currPro.includes) {
        mainPath = currPro.includes[pro].main;
        if (!fs.existsSync(mainPath)) continue;

        fs.readdirSync(mainPath).forEach(function(combineFile) {
            if (fileMap[combineFile]) {
                console.log("当前项目和包含项目存在同名文件："+combineFile+"::"+mainPath);
            } else {
                fileMap[combineFile] = file.load(combineFile, currPro.includes[pro])
            }
        })
    }

    if (hint.getErrCount()>0) {
        console.log("项目代码存在错误，请先解决.");
        // process.exit(1); 
    }

    return fileMap;
}

function init(proConfig){
    console.log('\n=== 正在分析文件依赖 ...');

    currPro = proConfig;

    parser.checkModule();
    
    return loadMain();
}

exports.init = init;
