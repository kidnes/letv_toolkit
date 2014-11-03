/**
 * @file 启动本地Socket服务器
 * @author liubin
 */

var http = require("http");

function start(config) {
    try {
        var WebSocket = require('faye-websocket');

        var socketServer = http.createServer();
        socketServer.on('upgrade', function(request, socket, body) {
            if (WebSocket.isWebSocket(request)) {
                var ws = new WebSocket(request, socket, body);

                ws.on('message', function(event) {
                    console.log(event.data);
                });

                ws.on('close', function(event) {
                    console.log('close', event.code, event.reason);
                    console.log('============================');
                    ws = null;
                });
            }
        });

        socketServer.listen(config.socketPort);
        console.log("Socket has started on:" + config.socketPort);
    } catch (e) {}
}

function init(config) {
    var io = require('socket.io').listen(8002);

    io.sockets.on('connection', function(socket) {
        console.log('Connection Success!');
        socket.emit('news', {
            hello: 'world'
        });
        socket.on('data', function(data) {
            console.log(data);
        });
    });

    console.log("Socket has started on:8002");
}

exports.init = init;
exports.start = start;