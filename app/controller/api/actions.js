var fs = require('fs-extra');
var mongoose = require('mongoose');
var exec = require('child_process').exec;
var common = require('../../../www/js/common');
var fileHelper = require('../../helper/file_helper');
var zipHelper = require('../../helper/zip_helper');
var systemSettingHelper = require('../../helper/system_setting_helper');
var multer = require('multer');

var RobotNode = mongoose.model('RobotNode');
var Project = mongoose.model('Project');


var archiver = require('archiver');

var actions = {};
actions.createProjectFiles = function (req, res) {
    var nodeId = req.params.id;
    RobotNode.findOne({_id: nodeId}, function (err, robotNode) {
        if (robotNode) {
            var pNode = robotNode;
            var projectPath = systemSettingHelper.settings.runPath + req.currentUser.user + "/" + pNode._id;

            fileHelper.createProjectFiles(pNode, projectPath,null, function (err) {
                if(err){
                    res.resFormat.data = err;
                    res.resFormat.logicState = 1;
                    res.resFormat.msg = "创建项目文件时错误";
                    res.json(res.resFormat);
                }else{
                    res.json(res.resFormat);
                }
            });
        } else {
            res.resFormat.logicState = 1;
            res.resFormat.msg = "没有找到该节点";
            res.json(res.resFormat);
        }
    });
};

actions.downloadProjectFiles = function (req, res) {


    // res.download('config.rb');

    var nodeId = req.params.id;
    RobotNode.findOne({_id: nodeId}, function (err, robotNode) {
        if (robotNode) {
            var pNode = robotNode;
            var projectPath = systemSettingHelper.settings.runPath + req.currentUser.user + "/" + pNode._id;
            fileHelper.createProjectFiles(pNode, projectPath,null, function (err) {
                if(err){
                    res.resFormat.data = err;
                    res.resFormat.logicState = 1;
                    res.resFormat.msg = "创建项目文件时错误";
                    res.json(res.resFormat);
                }else{
                    var path = projectPath+"/"+pNode.name;
                    zipHelper.zip(path,path+".zip",function () {
                        console.log("zip finish");
                        res.download(path+".zip");
                    });
                }
            });
        } else {
            res.resFormat.logicState = 1;
            res.resFormat.msg = "没有找到该节点";
            res.json(res.resFormat);
        }
    });
};

actions.runProject = function (req, res) {
    var nodeId = req.params.id;
    RobotNode.findOne({_id: nodeId}, function (err, robotNode) {
        if (robotNode) {
            var pNode = robotNode;
            var projectPath = systemSettingHelper.settings.runPath + req.currentUser.user + "/"  + pNode._id;
            fileHelper.createProjectFiles(pNode, projectPath,null, function () {
                console.log("文件生成完成");
                exec('pybot --outputdir '+projectPath+" "+projectPath + "/" + pNode.name,function(error,stdout,stderr){
                    console.log("执行完成");
                    // if(stdout.length >1){
                    //     console.log('you offer args:',stdout);
                    // } else {
                    //     console.log('you don\'t offer args');
                    // }
                    if(error) {
                        console.info('stderr : '+stderr);
                    }
                });
                res.json(res.resFormat);
            });
        } else {
            res.resFormat.logicState = 1;
            res.resFormat.msg = "没有找到该节点";
            res.json(res.resFormat);
        }
    });
};


var uploadProject = multer({dest: systemSettingHelper.settings.uploadPath});
actions.importProject = [uploadProject.fields([
    {name: 'file'}
]),function (req, res) {
    console.log(req.body);
    console.log(req.params);

    for(var i in req.files){
        console.log(req.files[i]);
        req.files[i].forEach(function (file) {
            var basePath = systemSettingHelper.settings.uploadPath;
            var dstPath = systemSettingHelper.settings.uploadPath + file.originalname;
            fs.rename(file.path, dstPath, function(err) {
                if(err){
                    console.log('rename error: ' + err);
                } else {
                    console.log('rename ok');
                    zipHelper.unzip(dstPath,basePath,function () {
                        console.log("unzip finish");
                        fileHelper.importProject(dstPath.replace(".zip",""),function (node) {
                            Project.findOne({_id:req.params.id},function (err, project) {
                                project.robotNode = node._id;
                                project.save(function (err, project) {
                                    res.resFormat.data = project;
                                    res.json(res.resFormat);
                                });
                            });
                        });
                    });
                }
            });
        });
    }
}];

module.exports = actions;