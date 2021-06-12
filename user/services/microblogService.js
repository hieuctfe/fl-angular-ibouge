'use strict';

ibouge.service('MicroblogService', ['$rootScope', '$http', '$q', '$timeout', function($rootScope, $http, $q, $timeout) {
    this.getMicroblog = function (room) {
        var deferred = $q.defer();
        var userId = $rootScope.sess._id;
        $http.get('/microblog/' + room + '?id=' + userId).then(function(response) {
            deferred.resolve(response.data);
        }, function(response) {
            referrer.reject(response.data);
        });
        return deferred.promise;
    };

    this.getAllMicroblogs = function(){
        var deferred = $q.defer();
        $http.get('/microblog/allmicroblogs').then(function(response) {
            deferred.resolve(response.data);
        }, function(response) {
            deferred.reject(response.data);
        });
        return deferred.promise;
    };

    this.getMicroblogForInvitee = function (room, creator) {
        var deferred = $q.defer();
        var userId = creator;
        $http.get('/microblog/' + room + '?id=' + userId).then(function(response) {
            deferred.resolve(response.data);
        }, function(response) {
            referrer.reject(response.data);
        });
        return deferred.promise;
    };

    this.changeMicroblogPic = function (room, data) {
        return $http.post('/microblog/microblogpic/' + room, data);
    };

    this.getMicroblogPic = function(img) {
        return img && img !== '' ? img : 'img/upload-photo.png';
    };

    this.getMyMicroblogs = function () {
        var deferred = $q.defer();
        var userId = $rootScope.sess._id;
        $http.get('/microblogs/?id=' + userId).then(function(response) {
            deferred.resolve(response.data);
        }, function(response) {
            referrer.reject({status: response.status, error: response.data})
        });
        return deferred.promise;
    };

    this.createMicroblog = function(data) {
        var deferred = $q.defer();

        $timeout(function () {

            // if data exists
            if (data) {

                // create a new property for object data
                data.id = $rootScope.sess._id;

                // if session user does not exist in the data object
                if (data.users.indexOf(data.id) < 0) {

                    // push my id in data.users array
                    data.users.push(data.id);

                }

                // this will be the room number
                var microblogId = Date.now().toString();

                // create form for data
                var fd = new FormData();

                fd.append('userId', $rootScope.sess._id);
                fd.append('users', data.users);
                fd.append('room', microblogId);
                fd.append('isMicroblog', 'true');
                fd.append('microblogName', data.name);
                fd.append('albumName', data.albumName);
                fd.append('coordinates0', data.coordinates[0]);
                fd.append('coordinates1', data.coordinates[1]);
                if (data.microblogImgFile) {
                    fd.append('file', data.microblogImgFile);
                }

                // send data to s3 bucket and DB through http request
                $http.post('/microblog/', fd, {
                    transformRequest: angular.identity,
                    headers: { 'Content-Type': undefined }
                }).then(function(response) {
                    deferred.resolve(response.data);
                }, function(response) {
                    deferred.resolve(response.data)
                });

            } else {

                deferred.reject('Invalid data');
            }
        });

        return deferred.promise;
    };

    this.addMicroblogNotification = function(data) {
        var deferred = $q.defer();
        $timeout(function () {
            if (data.microblog && data.friends) {
            $http.post('/microblog/notification', data).then(function(response) {
                deferred.resolve(response.data);
            }, function(response) {
                deferred.resolve(response.data)
            });
            } else {
                deferred.reject('Invalid data');
            }
        });
        return deferred.promise;
    };

    this.addMeToAllInvolved = function(data) {
        var deferred = $q.defer();
        $timeout(function () {
            if (data.user && data.room) {
                $http.post('/microblog/add-me-to-allInvolved', data).then(function (response) {
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

    this.updateAllInvolvedArray = function(data) {
        var deferred = $q.defer();
        $timeout(function () {
            if (data.room && data.users) {
                $http.post('/microblog/update-all-involved-array', data).then(function (response) {
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

    this.removeUserFromMicroblog = function(data) {
        var deferred = $q.defer();
        $timeout(function () {
            if (data.user && data.room) {
                $http.post('/microblog/remove-user', data).then(function (response) {
                    deferred.resolve(response.data);
                }, function (response) {
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