var socketIo = require('socket.io');
var _ = require('underscore');
var exec = require('child_process').exec;
var common = require('../../www/js/common');
var fileHelper = require('../helper/file_helper');
var listenHelper = require('../helper/listen_helper');
var systemSettingHelper = require('../helper/system_setting_helper');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var RobotNode = mongoose.model('RobotNode');
var Session = mongoose.model('Session');
var uuidV4 = require('uuid/v4');

var io;
var connections = [];

var findSocket = function (socket) {
    return connections.find(function (socketObj) {
        return socketObj.socket == socket;
    })
};
var getCurrentUser = function (socket,cb) {
    var socketObj = findSocket(socket);
    if(socketObj && socketObj.session != null ){

        Session.find({_id: socketObj.session})
            .populate({
                path: 'user'
            })
            .exec(function (err, session) {
                console.log(session);
                cb(err,session[0].user)
            });
    }else {
        cb("session不存在");
    }

};
var sendToAllAboutCount = function () {
    connections.forEach(function(socketObj){

        if(socketObj.editingProject == null){
            //跳过
        }else{
            var list = _.filter(connections,function (obj) {
                return obj.editingProject == socketObj.editingProject;
            });
            list.forEach(function (obj) {
                obj.socket.emit('workingOnProjectCount', { count: list.length });
            });
        }

        if(socketObj.editingNode == null){
            //跳过
        }else{
            var list = _.filter(connections,function (obj) {
                return obj.editingNode == socketObj.editingNode;
            });
            list.forEach(function (obj) {
                obj.socket.emit('workingOnNodeCount', { count: list.length });
            });
        }

    });
};
module.exports.createServer = function (server) {
    io = socketIo(server);
    io.on('connection', function (socket) {
        connections.push({
            socket:socket,
            session:null,
            editingNode:null,
            editingProject:null
        });
        // socket.emit('news', { hello: 'world' });
        // var sendNews = function () {
        //     socket.emit('news', { hello: connections.length });
        //     setTimeout(sendNews,5000);
        // };
        // sendNews();
        socket.on('currentProject', function (data) {
            findSocket(socket).editingProject = data.node;
            var currentProjectList = _.filter(connections,function (socketObj) {
                return socketObj.editingProject == data.node;
            });
            currentProjectList.forEach(function (socketObj) {
                socketObj.socket.emit('currentProjectCount', { count: currentProjectList.length });
            });
        });
        socket.on('currentNode', function (data) {
            findSocket(socket).editingNode = data.node;
            var currentNodeList = _.filter(connections,function (socketObj) {
                return socketObj.editingNode == data.node;
            });
            currentNodeList.forEach(function (socketObj) {
                socketObj.socket.emit('currentNodeCount', { count: currentNodeList.length });
            });
        });
        socket.on('leaveWorkspace', function (data) {
            var socketObj = findSocket(socket);
            socketObj.editingNode = null;
            socketObj.editingProject = null;
            sendToAllAboutCount();
        });
        socket.on('debug', function (data) {
            console.log("启动调试");
            getCurrentUser(socket,function (err,currentUser) {
                if(err){
                    //不处理
                    console.log(err);
                }else{

                    // console.log(currentUser);
                    var nodeId = data.node;
                    var basePath = systemSettingHelper.settings.debugPath;
                    RobotNode.findOne({_id: nodeId}, function (err, robotNode) {
                        if (robotNode) {
                            var pNode = robotNode;
                            var projectPath = basePath + common.strHelp.space2_(currentUser.name) + "/" +  pNode._id;
                            fileHelper.createProjectFiles(pNode , projectPath , data.options , function () {
                                var outputPath = systemSettingHelper.settings.outputPath + uuidV4().substring(0,8);
                                listenHelper.start(function (address) {
                                    var commadLineStr = 'pybot --outputdir ' + outputPath + " " + "--listener " + process.cwd() + "/app/lib/py/TestRunnerAgent.py" + ":" + address.port + ":False " + projectPath + "/" + common.strHelp.space2_(pNode.name);
                                    console.log(commadLineStr);
                                    exec(commadLineStr,{},function(error,stdout,stderr){
                                        console.log(arguments);
                                        if(error) {
                                            console.info('stderr : '+stderr);
                                            socket.emit('debugResult', { result: stdout });
                                        }
                                        if(stdout.length >1){
                                            console.log('stdout:' + stdout);
                                            socket.emit('debugResult', { result: stdout });
                                        } else if(stderr.length > 0) {
                                            console.log('stderr:' + stderr);
                                            socket.emit('debugResult', { result: stderr });
                                        }
                                    });
                                },function (data) {
                                    switch (data[0]){
                                        case "start_test":
                                            socket.emit('debugProcess', { result:"Starting test: " + data[1][1].longname });
                                            break;
                                        case "end_test":
                                            socket.emit('debugProcess', { result:"Ending test:   " + data[1][1].longname });
                                            break;
                                        case "log_message":
                                            socket.emit('debugProcess', { result:data[1][0].timestamp + " : " + data[1][0].level + " : "+ data[1][0].message });
                                            break;
                                        case "close":
                                            socket.emit('debugResult', {result: "测试完成，报告地址：" + outputPath + "/report.html"});
                                            break;
                                        default:
                                    }
                                });

                            });
                        } else {
                        }
                    });

                }

            });
        });
        socket.on('c-mSession', function (data) {
            if(data.mSession){
                Session.findOne(data.mSession,function (err,session) {
                    var index = connections.findIndex(function (value) {
                        return value.socket == socket;
                    });
                    connections[index].session = session;
                    socket.emit('s-user', { user: session.user });
                });
            }
        });

        socket.on('currentSession', function (data) {
            if(data.session){
                var index = connections.findIndex(function (connection) {
                    return connection.socket == socket;
                });
                connections[index].session = data.session;
            }
        });

        socket.on('disconnect', function() {
            connections.splice(connections.findIndex(function (value) {
                return value.socket == socket;
            }), 1);
        });

        // 测试服务端reconnect 不知道是什么效果
        socket.on('reconnect', function() {
            console.log("reconnect");
        });
    });
};

module.exports.nodeUpdate = function (node) {
    io.sockets.emit("nodeUpdate",node);
};