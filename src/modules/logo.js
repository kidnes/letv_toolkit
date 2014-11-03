var utils = require('./utils');

function LTKLogo() {
    var version = 'v1.0';
    var logo = 
'\n'+

   utils.red(' __        ______    __     __ \n')+
utils.yellow('/\\ \\       \\_____\\   \\ \\   / /\n')+
 utils.green('\\ \\ \\____     \\ \\     \\ \\ / /  \n')+
utils.purple(' \\ \\_____\\     \\ \\     \\ \\ \\ \\  \n')+
  utils.blue('  \\/_____/      \\_\\     \\_\\  \\_\\   ') + ' ' + version + '\n\n';

    logo += '命令：\n' +
            '        release ms      打包并上传文件到CDN\n' +
            '        build ms        打包合并文件\n' +
            '        deploy ms       同步SVN、打包并上传文件\n' +
            '        server ms       启动本地文件服务器\n' +
            '        hint ms         语法检测\n' +
            '        weinre          移动端远程调试，url增加参数?sip={本机IP}\n';

    logo += '工具： \n' +
            '        线上文件比对工具：http://10.200.89.126/letvjsdiff/client/\n'+
            '        Hosts转代理工具：http://10.200.89.126/\n';


    return logo;
};

exports.LTKLogo = LTKLogo;
