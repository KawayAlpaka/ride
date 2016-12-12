var net = require('net');

var start = function (cbOnListen,cbOnData) {
    var server = net.createServer();
    server.on('connection', function(socket) {
        socket.on('data', function(data) {
            var str = data.toString();
            try{
                var jsonStrs = str.split(/J\d{1,4}\|/);
                jsonStrs.forEach(function (jsonStr) {
                    if(jsonStr.trim().length > 0){
                        var json = JSON.parse(jsonStr);
                        cbOnData(json);
                        if(json[0] == "close"){
                            console.log("socket destroy");
                            socket.destroy();
                            console.log("Server close");
                            server.close();
                        }
                    }
                });
            }catch(err) {
                console.log('err:'+str);
            }

        });
        socket.on('error', function(e) {
            console.log('error:');
            console.log(e);
            server.close();
        });
        socket.on('close',function (e) {
            console.log('socket on close');
            console.log(e);
        });
        socket.on('end', function() {
            console.log('socket on end');
        });
    }).on('error', function (err) {
        console.log(err);
        throw err;
    });

    server.on("close",function () {
        console.log("server on close");
    });
    server.on("error",function () {
        console.log("server on error");
    });

    server.listen(function () {
        console.log(server.address());
        cbOnListen(server.address());
    });
};

module.exports.start = start;