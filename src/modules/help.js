
function help() {
    var version = 'v1.0';
    var content = '';

    content += '使用示例：cmd [project] [options]\n' +
            '        cmd命令：     release build deploy server hint weinre\n' +
            '        project参数： 项目名，如主站lejs，M站ms，合作站coop等\n' +
            '        options参数： \n' +
            '           -h, --help      显示帮助文档 \n' +
            '           -l, --local     使用tool/letv/src/abc.js文件打包 \n' +
            '           --hint          使用jshint进行代码检测 \n';


    return content;
};

exports.help = help;
