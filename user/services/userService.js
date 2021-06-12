"use strict";

ibouge.service("UserService", [
  "$state",
  "$rootScope",
  "$q",
  "$timeout",
  "$http",
  function ($state, $rootScope, $q, $timeout, $http) {
    this.myLocation = { lat: null, lan: null };
    this.friends = [];
    this.status = {
      isAuthenticated: false,
    };

    this.updateMyLocation = function () {
      var email = $rootScope.current_user;
      var updateUser = this.updateUser;
      var myLocation = this.myLocation;
      var status = this.status;
      $http({ method: "GET", url: "https://ipinfo.io" }).then(
        function (response) {
          var data = response.data;
          var lat = data.loc.split(",")[0];
          var lan = data.loc.split(",")[1];
          var updateData = {
            ip: data.ip,
            latitude: lat,
            longitude: lan,
          };

          // update my locations
          myLocation.lat = lat;
          myLocation.lan = lan;

          updateUser(email, updateData).then(
            function (response) {
              $rootScope.sess = response.data;
              status.isAuthenticated = true;
              $rootScope.$broadcast("location-updated");
            },
            function () {
              console.log("update user failed", response.data);
            },
          );
        },
        function (response) {
          console.log(response);
          console.log("get ip data failed");
        },
      );
    };

    this.getUser = function (id) {
      return $http.get("/users/" + id);
    };

    this.updateUser = function (email, data) {
      return $http.put("/users/" + email, data);
    };

    this.changeProfilePic = function (email, data) {
      var deferred = $q.defer();

      $timeout(function () {
        // if email and picture file were received
        if (email && data) {
          // create form for data
          var fd = new FormData();

          fd.append("userId", data.userId);
          fd.append("userEmail", email);
          fd.append("albumName", data.albumName);
          if (data.file) {
            fd.append("file", data.file);
          }
          if (data.originalFile) {
            fd.append("originalFile", data.originalFile);
          }

          // send data to s3 bucket
          $http
            .post("/users/profilepic/" + email, fd, {
              transformRequest: angular.identity,
              headers: { "Content-Type": undefined },
            })
            .then(
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

    this.loadMeta = function () {
      // var deferred = $q.defer();
      return new Promise((resolve, reject) =>
        $http.get("/users/meta?id=" + $rootScope.sess._id).then(
          function (response) {
            console.log(response);
            return resolve(response.data);
          },
          function (response) {
            return reject(response.data);
          },
        ),
      );
      // return deferred.promise;
    };

    this.userMetaPromises = {};
    this.getUserMeta = function (userId) {
      if (userId in this.userMetaPromises) {
        return this.userMetaPromises[userId].promise;
      } else {
        var deferred = $q.defer();
        this.userMetaPromises[userId] = deferred;
        $http.get("/users/get-user-meta?id=" + userId).then(
          function (response) {
            deferred.resolve(response.data);
          },
          function (response) {
            deferred.reject(response.data);
          },
        );
        return deferred.promise;
      }
    };

    this.getAllUsers = function () {
      var deferred = $q.defer();
      $http.get("/users/get-all-users?id=" + $rootScope.sess._id).then(
        function (response) {
          deferred.resolve(response.data);
        },
        function (response) {
          deferred.reject(response.data);
        },
      );
      return deferred.promise;
    };

    this.getMyFriends = function () {
      var deferred = $q.defer();
      $http.get("/users/friends?id=" + $rootScope.sess._id).then(
        function (response) {
          deferred.resolve(response.data);
        },
        function (response) {
          deferred.reject(response.data);
        },
      );
      return deferred.promise;
    };

    this.getProfileFriends = function (id) {
      var deferred = $q.defer();
      $http.get("/users/profile-friends?id=" + $rootScope.sess._id + "&profile=" + id).then(
        function (response) {
          deferred.resolve(response.data);
        },
        function (response) {
          deferred.reject(response.data);
        },
      );
      return deferred.promise;
    };

    this.loadBlockList = function (email) {
      var email = $rootScope.current_user;
      return $http.get("/users/blocklist?email=" + email);
    };

    this.getProfilePic = function (img) {
      return img && img !== "" ? img : "img/upload-photo.png";
    };

    this.loadInbox = function () {
      var deferred = $q.defer();
      $http.get("/users/inbox?id=" + $rootScope.sess._id).then(
        function (response) {
          deferred.resolve(response.data);
        },
        function (response) {
          deferred.reject(null);
        },
      );
      return deferred.promise;
    };

    this.loadNotifications = function () {
      var deferred = $q.defer();
      $http.get("/users/notifications?id=" + $rootScope.sess._id).then(
        function (response) {
          deferred.resolve(response.data);
        },
        function (response) {
          deferred.reject(response.data);
        },
      );
      return deferred.promise;
    };

    this.loadMicroblogs = function () {
      var deferred = $q.defer();
      $http.get("/users/microblogs?id=" + $rootScope.sess._id).then(
        function (response) {
          deferred.resolve(response.data);
        },
        function (response) {
          deferred.reject(response.data);
        },
      );
      return deferred.promise;
    };

    this.updateUserBookmarkedMicroblogs = function (user, microblogRoom) {
      var deferred = $q.defer();
      var reqData = {
        me: user,
        room: microblogRoom,
      };
      $http.post("users/update-user-bookmarked-microblogs", reqData).then(
        function (response) {
          deferred.resolve(response.data);
        },
        function (response) {
          deferred.reject(response.data);
        },
      );
      return deferred.promise;
    };

    this.unbookmarkMicroblog = function (user, microblogRoom) {
      var deferred = $q.defer();
      var reqData = {
        me: user,
        room: microblogRoom,
      };
      $http.post("users/unbookmark-microblog", reqData).then(
        function (response) {
          deferred.resolve(response.data);
        },
        function (response) {
          deferred.reject(response.data);
        },
      );
      return deferred.promise;
    };

    this.sendFriendRequest = function (friendId) {
      var deferred = $q.defer();
      var reqData = {
        id: $rootScope.sess._id,
        friend: friendId,
      };
      $http.post("/users/friend-request", reqData).then(
        function (response) {
          deferred.resolve(response.data);
        },
        function (response) {
          deferred.reject(response.data);
        },
      );
      return deferred.promise;
    };

    this.getUserProfile = function (userId) {
      var deferred = $q.defer();
      $http.get("/users/profile?id=" + $rootScope.sess._id + "&user=" + userId).then(
        function (response) {
          var user = response.data.user;
          user.friend_status = response.data.friend_status;
          deferred.resolve(user);
        },
        function (response) {
          deferred.reject(response.data);
        },
      );
      return deferred.promise;
    };

    this.acceptFriendRequest = function (userId) {
      var deferred = $q.defer();
      var reqData = {
        id: $rootScope.sess._id,
        user: userId,
      };
      $http.post("/users/accept-friend-request", reqData).then(
        function (response) {
          deferred.resolve(response.data);
        },
        function (response) {
          deferred.reject(response.data);
        },
      );
      return deferred.promise;
    };

    this.unfriend = function (userId) {
      var deferred = $q.defer();
      var reqData = {
        id: $rootScope.sess._id,
        user: userId,
      };
      $http.post("/users/unfriend", reqData).then(
        function (response) {
          deferred.resolve(response.data);
        },
        function (response) {
          deferred.reject(response.data);
        },
      );
      return deferred.promise;
    };

    this.getMyDashboardMetaData = function () {
      var deferred = $q.defer();
      $http.get("/my-dashboard/meta?id=" + $rootScope.sess._id).then(
        function (response) {
          deferred.resolve(response.data);
        },
        function (response) {
          deferred.reject(response.data);
        },
      );
      return deferred.promise;
    };

    this.getGenderAbbrev = function (gender) {
      if (gender === 0) {
        return "M";
      } else if (gender === 1) {
        return "F";
      } else {
        return "";
      }
    };

    return this;
  },
]);
