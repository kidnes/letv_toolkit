var exec = require('child_process').exec,
    path = require('path'),
    fs = require('fs');


function updateSVN(callback) {
    var base = path.resolve(__dirname+'../../../../../'),
        svnbase = base + '/*/trunk/';

    if (fs.existsSync( base + '.svn')) {
        console.log('=== 正在更新svn ...');

        exec('svn up '+svnbase, function(err, stdout, stderr) {
            if (err) {
                console.log('svn更新失败:\n');
                return;
            }
            console.log(stdout);

            if (typeof callback === 'function') callback();
        });
    } else {
        if (typeof callback === 'function') callback();
    }
    
}

exports.updateSVN = updateSVN;