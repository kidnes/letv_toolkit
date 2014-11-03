/**
 * @file 解析LTK模块
 * @desc 解析模块化开发框架
 *      1、解析模块依赖；
 *      2、每个文件最多定义一个模块；
 *      3、按路径增加模块定义名
 *      4、替换模块引用路径为模块名  //框架内处理
 *      5、模块是否存在；
 * @author liubin
 */

var path, currModule, moduleMap = {}, dependList = [];

var DEFINE_RE = /^[ \t]*define\s*\(\s*(?:(['"])([\w+\.\/\-]*)\1)*/mg;
var PATH_RE = /\/|\\/g;
var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g;

function parseDefine(file) {
    DEFINE_RE.lastIndex = 0;
    var matchCount = 0, result;
    
    currModule = path;

    while((result = DEFINE_RE.exec(file)) != null) {
        if (matchCount++ >= 1){
            console.log('文件定义了两个模块：'+path);
            return;
        }
        if (result[1] == undefined) {
            file = file.substr(0, DEFINE_RE.lastIndex) + '"' + path + '",' + file.substr(DEFINE_RE.lastIndex);
        }  else if (result[2] !== undefined) {
            var t = result[2];
            path = t.charAt(0) != '-' ? t : t.slice(1);
        }

        currModule = path;
    }
    return file;
}

var DOT_RE = /\w+\.\//g
var DOUBLE_DOT_RE = /\w+\.\w+\.\.\//

function parsePaths(id, path) {
    if (!/^\./.test(id)) return id;

    path = (path+id).replace(DOT_RE, "")

    while (path.match(DOUBLE_DOT_RE)) {
        path = path.replace(DOUBLE_DOT_RE, "")
    }

    return path
}

function parseModule(file) {
    dependList = [];
    dependList.push(currModule);

    var ret = [];

    file.replace(REQUIRE_RE, function(m, m1, m2) {
        if (m2) {
            m2 = parsePaths(m2, path)
            ret.push(m2);
            parseDepends(m2);
        }
    });

    if (typeof moduleMap[currModule] == 'undefined') moduleMap[currModule] = [];

    moduleMap[currModule] = moduleMap[currModule].concat(ret);

    return file;
}

function parseDepends(m) {
    if (typeof moduleMap[m] == 'undefined' || moduleMap[m].length <= 0) return;
    dependList.push(m);
    moduleMap[m].forEach(function(mod){
        if (mod == currModule) {
            dependList.push(mod);
            console.log("模块:"+path+" 存在依赖：\n"+dependList.join("==>"));
            console.log("文件打包压缩失败，请先解决依赖问题!");
            process.exit(1); 
            // return;
        } 
            
        parseDepends(mod);
    })
    dependList.pop();
}

function checkModule() {
    for (var m in moduleMap) {
        moduleMap[m].forEach(function(item){
            if (typeof moduleMap[item] == 'undefined') {
                console.log("可能引用不存在模块:"+m+"==>"+item);
                // console.log("文件打包压缩失败，请先解决模块不存在问题!");
                // process.exit(1); 
            }
        })
    }

    moduleMap = {};
}

function parseLTK(file, path_) {
    path = path_.replace(/\/|\\/g, '.').replace(/\.js$/, '');

    file = parseDefine(file);

    // file = parseModule(file);

    return file;
}



exports.parseLTK = parseLTK;
exports.checkModule = checkModule;