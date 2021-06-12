'use strict';

ibouge.service('StatusUpdatesService', ['$http', '$q', '$timeout', function($http, $q, $timeout) {

    this.getAllStatusUpdates = function(){
        var deferred = $q.defer();
        $http.get('/status/getStatus').then(function(response) {
            deferred.resolve(response.data);
        }, function(response) {
            deferred.reject(response.data);
        });
        return deferred.promise;
    };

    this.deleteStatus = function (id, from) {
        var deferred = $q.defer();
        $timeout(function(){
            if (id && from) {
                $http.post('status/delete-status', {id: id, from: from}).then(function(response) {
                    deferred.resolve(response.data);
                }, function(response) {
                    deferred.resolve(response.data);
                });
            } else {
                deferred.reject('Invalid data');
            }
        });
        return deferred.promise;
    };

    this.deleteReply = function (reply_id, status_id) {
        var deferred = $q.defer();
        $timeout(function(){
            if (reply_id && status_id) {
                $http.post('status/delete-reply', {reply_id: reply_id, status_id: status_id}).then(function(response) {
                    deferred.resolve(response.data);
                }, function(response) {
                    deferred.resolve(response.data);
                });
            } else {
                deferred.reject('Invalid data');
            }
        });
        return deferred.promise;
    };

    this.postNewStatus = function (data) {
        var deferred = $q.defer();
        $timeout(function(){
            if (data) {
                $http.post('status/new-status', data).then(function(response) {
                    deferred.resolve(response.data);
                }, function(response) {
                    deferred.resolve(response.data);
                });
            } else {
                deferred.reject('Invalid data');
            }
        });
        return deferred.promise;
    };

    this.postNewReply = function (data) {
        var deferred = $q.defer();
        $timeout(function(){
            if (data) {
                $http.post('status/new-reply', data).then(function(response) {
                    deferred.resolve(response.data);
                }, function(response) {
                    deferred.resolve(response.data);
                });
            } else {
                deferred.reject('Invalid data');
            }
        });
        return deferred.promise;
    };

    this.saveImageToBucketAndCreateStatus = function(file, albumName, data) {
        var deferred = $q.defer();
        $timeout(function(){
            if (file && albumName && data) {
                var fd = new FormData();

                fd.append('file', file);
                fd.append('albumName', albumName);
                fd.append('userId', data.from);
                fd.append('message', data.message);
                fd.append('status_type', data.status_type);
                fd.append('time', data.time);

                $http.post('status/image-status', fd, {
                    transformRequest: angular.identity,
                    headers: { 'Content-Type': undefined }
                }).then(function(response) {
                    deferred.resolve(response.data);
                }, function(response) {
                    deferred.resolve(response.data);
                });
            } else {
                deferred.reject('Invalid data');
            }
        });
        return deferred.promise;
    };

    return this;
}]);

ibouge.service('SaveDataToS3Bucket', ['$http', '$q', '$timeout', function($http, $q, $timeout) {

    this.saveImageToBucket = function(file, albumName, data) {

        var deferred = $q.defer();
        $timeout(function(){
            if (file && albumName && data) {
                var fd = new FormData();

                fd.append('file', file);
                fd.append('filename', file.name);

                fd.append('albumName', albumName);

                fd.append('userId', data.from);
                fd.append('message', data.message);
                fd.append('status_type', data.status_type);
                fd.append('time', data.time);
                fd.append('likes', data.likes);

                $http.post('s3Bucket/image-to-album', fd, {
                    transformRequest: angular.identity,
                    headers: { 'Content-Type': undefined }
                }).then(function(response) {
                    deferred.resolve(response.data);
                }, function(response) {
                    deferred.resolve(response.data);
                });
            } else {
                deferred.reject('Invalid data');
            }
        });
        return deferred.promise;
    };

    return this;
}]);