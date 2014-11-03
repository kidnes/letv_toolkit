var fs = require('fs'),
    http = require('http'),
    needle = require('needle'),
    evt = require("./event"),
    utils = require("./utils"),
    version, abcPath,
    total = count = 0,
    uploadingList = [],
    uploadedList = [],
    logFileList = [];

function init(path, ver) {
    version = ver;

    var arr = fs.readdirSync(path);

    uploadingList = [];
    uploadedList = [];
    logFileList = [];

    arr.forEach(function(file) {
        if (/\.js$/.test(file)) {
            var obj = {path:path, file:file};
            uploadingList.push(obj);
        }
    });

    total = uploadingList.length;

    for (var i=0,len = uploadingList.length; i < 5 && i < len; i++) {
        uploadfile();
    }
}

function uploadfile() {
    if (uploadingList.length <= 0) return;

    var obj = uploadingList.shift();
    uploadNeedle(obj.path, obj.file);
}

function uploadNeedle(path, fileName) {
    var options = getRequest();

    var buffer = fs.readFileSync(path+fileName);

    var data = {
        username: 'liubin1',
        channel: 'js',
        md5str: 'c33b33a211bea60b34f0bc7ee81b8802',
        compress: 85,
        watermark: 0,
        fdir: version,
        single_upload_submit: 'ok',
        single_upload_file: {
            buffer: buffer,
            filename: fileName,
            content_type: 'application/octet-stream'
        }
    }

    needle.post('http://upload.letvcdn.com:8000/single_upload_tool.php', data, options, function(err, resp, body) {
            if (err) {
                console.log('文件上传失败，请重试。');
                process.exit(1); 
            }

            var json = JSON.parse(body);
            if (json.state!==1) uploadErr(json.state);

            if (/\/abc[_\w+]*\.js$/.test(json.file)) abcPath = json.file;
            else console.log('上传文件成功：'+json.file);

            uploadedList.push(json.file);
            logFileList.push(json.file);

            if (++count == total) {
                console.log('=== 正在验证上传文件 ...');

                count = 0;

                for (var i=0, len = uploadedList.length; i < 10 && i < len; i++) {
                    checkFile();
                }
            } else {
                uploadfile();
            }

    });
}

function uploadErr(code) {
    var errenum = ['上传重复', 
        '上传文件格式不符合上传条件，拒上传',
        '身份验证失败',
        '上传文件大小不在允许上传范围之内',
        '上传文件名含中文或者空格',
        '文件上传失败'];

    console.warn('【错误】上传文件出错，不可以上线。\n错误：'+errenum[code-2]);
    process.exit(1);
}

function checkFile() {
    if (uploadedList.length <= 0) return;

    var url = uploadedList.shift();
    requestPage(url, function(data, res) {
        if (!data) {
            console.log('文件上传失败，请重试。');
            process.exit(1); 
        } else {
            if (++count == total) {
                releaseSucc();
            } else {
                checkFile();
            }
        }
    });
}

function releaseSucc() {
    if (abcPath) {
        console.log('验证成功，可以上线！')
        console.log('abc 路径：' + utils.yellow(abcPath));

        var data = '\n\n====== '+ new Date() + ' =====\n';
        fs.appendFileSync('upload.log',  data + logFileList.join('\n'), {encoding : 'utf8'});

        evt.trigger('releaseFinish');
    } else {
        console.log('abc上传失败!');
    }
}

function uploadForm(path, fileName) {
    var options = getRequest();

    var buffer = fs.readFileSync(path);

    // var data = {
    //     channel_name: 'js',
    //     userfile: {
    //         buffer: buffer,
    //         filename: fileName,
    //         content_type: 'application/octet-stream'
    //     },
    //     radiobutton: 'eightyfive',
    //     file_remark: '',
    //     upload_submit: ''
    // }

    var data = {
        username: 'liubin1',
        channel: 'js',
        md5str: 'c33b33a211bea60b34f0bc7ee81b8802',
        compress: 85,
        watermark: 0,
        upload_submit: 'ok',
        userfile: {
            buffer: buffer,
            filename: fileName,
            content_type: 'application/octet-stream'
        }
    }

    needle.post('http://upload.letvcdn.com:8000/uploadfile.php', data, options, function(err, resp, body) {
        console.log(err);
        // console.log(resp);
        console.log(body);
    });
}

function httpRequest(path, fileName) {
    var options = getRequest();

    var request = http.request(options, function(res) {
        var data = '';
        res.on('data', function(chunk) {
            data += chunk.toString();
            console.log('data:' + data);
        });
        res.on('end', function() {
            console.log(data);
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
        response.end();
    });

    var boundaryKey = Math.random().toString(16);
    request.setHeader('Content-Type', 'multipart/form-data; boundary="' + boundaryKey + '"');

    request.write(
        '------' + boundaryKey + '\r\n' + 'Content-Disposition: form-data; name="channel_name"\r\n\r\n' + 'js\r\n'
    );
    request.write(
        '------' + boundaryKey + '\r\n' + 'Content-Disposition: form-data; name="userfile"; filename="' + fileName + '"\r\n' + 'Content-Type: application/zip\r\n'
    );
    request.write(
        '------' + boundaryKey + '\r\n' + 'Content-Disposition: form-data; name="radiobutton"\r\n\r\n' + 'eightyfive\r\n'
    );
    request.write(
        '------' + boundaryKey + '\r\n' + 'Content-Disposition: form-data; name="file_remark"\r\n\r\n' + '""\r\n'
    );
    request.write(
        '------' + boundaryKey + '\r\n' + 'Content-Disposition: form-data; name="upload_submit"\r\n\r\n' + '""\r\n'
    );
    fs.createReadStream(path, {
        bufferSize: 4 * 1024
    }).on('end', function() {
        request.end('\r\n--' + boundaryKey + '--');
        request.end();
    }).pipe(request, {
        end: false
    });

    // request.end();
}

function getRequest() {
    var options = {
        'parse': true,
        'multipart': true,
        'host': 'upload.letvcdn.com',
        'port': 8000,
        'path': '/uploadfile.php',
        'method': 'POST',
        'headers': {
            'Cookie': 'upload_token=71837b4c3e169efe5334ac4b94a29456;upload_username=jsgroup;PHPSESSID=1359d96217507e99275b5a36fc1e0256',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip,deflate,sdch',
            'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6',
            'Content-Type': 'multipart/form-data'
        }
    }

    return options;
}

function requestPage(url, callback) {
    http.get(url, function(res) {
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
        callback();
    });
}

exports.init = init;
exports.uploadForm = uploadForm;