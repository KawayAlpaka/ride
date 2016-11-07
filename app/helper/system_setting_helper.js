"use strict";
var mongoose = require('mongoose');
var SystemSetting = mongoose.model('SystemSetting');

// var settings = {
//     runPath:"D:/test/",
//     uploadPath:"D:/web_ride/upload/projects/",
//     debugPath:"D:/debug/"
// };
var settings = {
    runPath: process.cwd() + "/temp/run/",
    uploadPath: process.cwd() + "/temp/upload/",
    debugPath: process.cwd() + "/temp/debug/"
};

var refreshOne = function (dbKey,ramKey) {
    SystemSetting.getSetting(dbKey,function (err, setting) {
        if(err){
            return;
        }else{
            if(setting && setting.value && setting.value.length>0){
                settings[ramKey] = setting.value;
            }
        }
    });
};
var systemSettingHelper = {
    settings:settings,
    refresh:function () {
        refreshOne("runPath","runPath");
        refreshOne("uploadPath","uploadPath");
        refreshOne("debugPath","debugPath");
    }
};

systemSettingHelper.refresh();

module.exports = systemSettingHelper;