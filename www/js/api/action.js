define([], function () {

    var mHttp;
    var api = {};
    api.init = function (obj) {
        mHttp = obj;
        return api;
    };
    api.createProjectFiles = function (id) {
        return mHttp({
            url : '/api/actions/createProjectFiles/'+id,
            method:'GET',
            type : 'json'
        });
    };
    api.runProject = function (id) {
        return mHttp({
            url : '/api/actions/runProject/'+id,
            method:'GET',
            type : 'json'
        });
    };
    api.getFileContent = function (id) {
        return mHttp({
            url : '/api/actions/getFileContent/'+id,
            method:'GET',
            type : 'json'
        });
    };
    api.updateNodeByContent = function (id,data) {
        return mHttp({
            url : '/api/actions/updateNodeByContent/'+id,
            method:'PUT',
            type : 'json',
            data: data
        });
    };

    return api;
});