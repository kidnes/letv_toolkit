/**
 * @file 检测文件
 * @desc 使用JSHint检测文件语法错误
 * @author liubin
 */

var jshint, reportor, fs, errCount = 0;
var _hintLevel = 0; //0:不检测，1：全部检测，2：只检测错误，不检测警告

var FILE_REG = /[\/\\]([\w\d-\.]+\.js)$/;

var options = {
    curly: false,   //if(a) return;
    eqeqeq: false,  //if (a==b)
    newcap: true,
    noarg: true,
    sub: true,
    undef: true,
    boss: true,
    node: true,
    browser: true,  //浏览器全局变量
    devel: true,
    lastsemic: true,    //var a = {}
    expr: true,  //a && function(){}
    strict: true,
    maxerr: 50000
};

var globals = {
    '__req': true,
    'LTK': true,
    'define': true,
    '$': true,
    'LETV': true
};

var ignoreList = ['jquery'];
var checkedList = {};

function init($argvs, level) {
    _hintLevel = level;

    if (level==2) options.strict = false;

    jshint = require("jshint/src/jshint").JSHINT;
    fs = require("fs");

    var OUT_REG = /\s+-[oO]\s+([\w\.]+)/;
    var out = $argvs.join(' ').match(OUT_REG);
    if (out && out.length>=2) {
        var currpath = fs.realpathSync('.')+'\\'+out[1]; 
        fs.existsSync(currpath) && fs.unlinkSync(currpath);

        reportor = function(data) {
            fs.appendFile(out[1], data, function (err) {
            });
        }
    } else {
        reportor = console.log;
    }
}

function checkIgnore(path) {
    for (var i=0; i<ignoreList.length; i++) {
        var reg = new RegExp(ignoreList[i], 'ig');
        if (reg.test(path)) return true;
    }
    return false;
}

function output(fileName) {
    var results = [];
    jshint.errors.forEach(function (err) {
        if (!err) return;
        if (_hintLevel==2&&!/^E0/.test(err.code)) return;
        results.push(fileName+': line '+err.line+', col '+err.character+', '+err.code+', '+err.reason);
        errCount++;
    });

    if (results.length > 0) reportor(results.join("\n"));
}

function hint(file, path) {
    if (!_hintLevel || checkIgnore(path) || checkedList[path]) return;

    checkedList[path] = true;

    var result = jshint(file, options, globals);

    if (result) return;

    var fileName = path.match(FILE_REG);
    // output(fileName[1]);
    output(path);
}

function getErrCount() {
    return errCount;
}

function hintLevel(level) {
    if (typeof level == 'undefined') {
        return _hintLevel;
    } else {
        _hintLevel = level;
    }
}

exports.init = init;
exports.hint = hint;
exports.getErrCount = getErrCount;
exports.hintLevel = hintLevel;