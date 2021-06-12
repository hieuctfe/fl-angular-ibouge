"use strict";

ibouge.service("ChatService", [
  "$rootScope",
  "$http",
  "$q",
  "$timeout",
  function ($rootScope, $http, $q, $timeout) {
    this.getChat = function (room) {
      var deferred = $q.defer();
      var userId = $rootScope.sess._id;
      $http.get("/chat/" + room + "?id=" + userId).then(
        function (response) {
          console.log(response.data);
          deferred.resolve(response.data);
        },
        function (response) {
          referrer.reject(response.data);
        },
      );
      return deferred.promise;
    };

    // this.getMyGroupChats = function() {
    // 	var deferred = $q.defer();
    // 	var userId = $rootScope.sess._id;
    // 	$http.get('/chat/group/?id=' + userId).then(function(response) {
    // 		deferred.resolve(response.data);
    // 	}, function(response) {
    // 		referrer.reject({status: response.status, error: response.data});
    // 	});
    // 	return deferred.promise;
    // };

    this.createGroupChat = function (data) {
      var deferred = $q.defer();
      $timeout(function () {
        if (data.name && data.users) {
          data.id = $rootScope.sess._id;
          if (data.users.indexOf(data.id) < 0) {
            data.users.push(data.id);
          }
          $http.post("/chat/group/", data).then(
            function (response) {
              deferred.resolve(response.data);
            },
            function (response) {
              deferred.resolve(response.data);
            },
          );
        } else {
          deferred.reject("Invalid data");
        }
      });
      return deferred.promise;
    };

    return this;
  },
]);
