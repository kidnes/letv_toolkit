/**
 * @file 启动本地开发服务器
 * @author liubin
 */

var http = require("http"),
	url = require("url");

var r_url = /js(?:\/\d+){2,3}(?:\/lejs_\d+|\w+)*\/([\w+\.-]+\.js)/i;

function start(config) {

	function onRequest(request, response) {

		var pathname = url.parse(request.url).pathname,
			startTime = +new Date();


		var r = pathname.match(r_url);

		if (r != null) {
			var file = require("./file"),
				content = file.loadServerFile(r[1]);

			if (content) {
				response.writeHead(200, {
					"Content-Type": "text/plain;charset=utf8"
				});

				response.write(content);

				response.end();
			} else {
				http.get('http://10.200.89.126' + pathname, function(res) {
					console.log("Got response: " + res.statusCode);
					response.writeHead(res.statusCode, {
						"Content-Type": "text/plain;charset=utf8"
					});
					resultdata = '';
		            res.on('data', function(chunk) {
		                resultdata += chunk;
		            });

		            res.on('end', function() {
		                if (!resultdata) {
		                    response.end();
		                    return;
		                }
		                response.write(resultdata);
		                response.end();
		                
		                if (res.statusCode == 200) console.log('代理126成功。')
		            });
				}).on('error', function(e) {
					response.writeHead(404);
					response.end();
				});
			}
		} else {
			response.writeHead(404);
			response.end();
		}

		console.log('onRequest:' + pathname + ', responseTime:' + (+new Date() - startTime));
	}

	http.createServer(onRequest).listen(config.serverPort);
	console.log("Server has started on:" + config.serverPort);
}

exports.start = start;