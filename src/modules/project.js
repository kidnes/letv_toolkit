/**
 * @file 项目依赖关系结构数据构建
 * @desc 文件内容已加载，生成压缩文件
 *
 *      生成项目数据结构：
 *      name: 项目名称
 *      base: 根目录
 *      src: 源代码
 *      dist: 输出目录
 *      main: 文件配置列表
 *      depends: 依赖项目数组
 *
 * @author liubin
 */

var pkgConfig, curProject, topPath, 
    projects={}, depends = {};

var fs = require('fs'),
    utils = require("./utils");


//扫描项目
function scanDirs() {
    topPath = pkgConfig.root;

    var files = fs.readdirSync(topPath),
        paths = ['dist', 'main'];

    files.forEach(function(pro){
        if (/^\./.test(pro)) return;

        var proModel = {
                'name': pro, 
                'base': topPath+pro+'/', 
                'src': topPath+pro+'/', 
                'root': pkgConfig.root};

        paths.forEach(function(item) {
            if (fs.existsSync(proModel['base']+item)) proModel[item] = proModel['base']+item+'/';
        });

        if (pkgConfig.projectsConfig[pro]) {
            utils.merge(proModel, pkgConfig.projectsConfig[pro]);
        }

        projects[pro] = proModel;
    });
}

function scanCurProject() {
    var pro = projects[curProject],
        basePath = pro['base'];

    if (!pro.dist) {
        fs.mkdirSync(basePath+'dist');
        pro.dist = basePath+'dist';
    }

    // if (pkgConfig.isDeploy) {     //使用deploy时，强制从trunk发布
    //     pro.config.src = 'trunk/src';
    // }

    // console.log('\n=== 正在分析路径:'+ utils.yellow(pro.config.src));
    // if (!/trunk/i.test(pro.config.src)) {
    //     console.log(utils.yellow('\n=== 提示：当前使用路径不是trunk，此版本不能上线。'));
    // } 

    parseProjcetDepends();
    // parseProjcetIncludes(curProject);
}

//解析项目依赖
function parseProjcetDepends() {
    for (var currPro in projects) {
        var curr = projects[currPro];
        if (!curr || !curr.depends) continue;
        
        var arrDeps = curr.depends,
            deps = {}, pro;

        for (var i=0; i < arrDeps.length; i++) {
            pro = arrDeps[i];
            if (projects[pro]) {
                deps[pro] = projects[pro];
            }
        }
        curr.depends = deps;
    }
    
    // if (config && config.depends) {
    //     if (curr.depends) return;
    //     var deps = {};
    //     config.depends.forEach(function(pro) {
    //         if (projects[pro] && !deps[pro]) {
    //             deps[pro] = projects[pro];
    //             projects[currPro].depends = deps;

    //             parseProjcetDepends(pro, projects[pro].base);
    //         }
    //     });
    // }
}

//解析项目包含关系
function parseProjcetIncludes(currPro) {
    var curr = projects[currPro], config = curr.config;
    if (config && config.includes) {
        if (curr.includes) return;
        var includes = {};
        config.includes.forEach(function(pro) {
            if (projects[pro] && !includes[pro]) {
                includes[pro] = projects[pro];
                projects[currPro].includes = includes;

                parseProjcetIncludes(pro);
                parseProjcetDepends(pro);
            }
        });
    }
}

function scanServerIncludes() {
    if (pkgConfig.isBuild !== false) return;
    var serInc = pkgConfig.serverInclude;
    if (serInc && serInc.length>0) {
        for (var i=0, len = serInc.length; i < len; i++) {
            parseProjcetDepends(serInc[i]);
        }
    }
}

function init(config) {
    console.log('\n=== 正在分析项目:'+utils.yellow(config.project));

    pkgConfig = config;
    curProject = config.project;

    scanDirs();

    scanCurProject();

    scanServerIncludes();
}

function getProject() {
    return projects;
}

exports.init = init;
exports.getProject = getProject;