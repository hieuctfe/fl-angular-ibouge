"use strict";

ibouge.controller("ProfileController", [
  "$scope",
  "$rootScope",
  "$state",
  "$stateParams",
  "UserService",
  "NotificationService",
  "SocketFactory",
  "StatusUpdatesService",
  "orderByFilter",
  "EventService",
  "$uibModal",
  "$http",
  function (
    $scope,
    $rootScope,
    $state,
    $stateParams,
    UserService,
    NotificationService,
    SocketFactory,
    StatusUpdatesService,
    orderBy,
    EventService,
    $uibModal,
    $http,
  ) {
    $scope.userService = UserService;
    $scope.user = null;
    $scope.friends = [];
    $scope.allowPost = false;
    $scope.usersEvents = [];
    $scope.showInviteBtns = false;
    $scope.buttonCaption = "Add as Friend";

    // get the socket connection to the server
    var socket = SocketFactory.connection;

    socket.on("new-notification-to-show", function (event) {
      $scope.notifications.hasNewMessage = true;
      $scope.$apply();
    });

    $scope.init = function () {
      if ($rootScope.sess && angular.isObject($rootScope.sess)) {
        if ($stateParams.USER_ID === $rootScope.sess._id) {
          // logged in user
          $scope.user = $rootScope.sess;
          $scope.allowPost = true;
          $scope.friends = UserService.friends;
          $scope.loadProfile($stateParams.USER_ID);
          $scope.showMyStatusUpdates();
        } else {
          // other user
          $scope.showInviteBtns = true;
          $scope.allowPost = false;
          $scope.loadProfile($stateParams.USER_ID);
          $scope.showMyStatusUpdates();
        }
      }
    };

    $scope.$on("presence", function (event, presenceData) {
      if ($scope.friends) {
        for (var i = 0; i < $scope.friends.length; i++) {
          if ($scope.friends[i]._id == presenceData.user_id) {
            $scope.$apply(function () {
              $scope.friends[i].is_online = presenceData.status;
            });
          }
        }
      }
    });

    $scope.loadProfile = function (id) {
      UserService.getUserProfile(id).then(
        function (user) {
          console.log(user);
          $scope.user = user;
          $scope.loadFriends(id);
          $scope.loadUsersEvents(id);

          // location Map
          mapboxgl.accessToken =
            "pk.eyJ1IjoiaWJvdWdlIiwiYSI6ImNqY2wzaXJ5YTAycWIzM2pyb3JhN20yenkifQ.jhimhHWkb-6GD3Tq8bvCKA";
          var map = new mapboxgl.Map({
            container: "map",
            style: "https://api.maptiler.com/maps/positron/style.json?key=RGierAHokphISswP6JTB",
            center: [user.location.coordinates[0], user.location.coordinates[1]], // starting position
            zoom: 9,
            minZoom: 9,
            maxZoom: 9,
          });

          var marker = new mapboxgl.Marker()
            .setLngLat([user.location.coordinates[0], user.location.coordinates[1]])
            .addTo(map);

          var reverseGeocodingURL =
            "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
            user.location.coordinates[0] +
            "," +
            user.location.coordinates[1] +
            ".json?access_token=pk.eyJ1IjoiaWJvdWdlIiwiYSI6ImNqY2wzaXJ5YTAycWIzM2pyb3JhN20yenkifQ.jhimhHWkb-6GD3Tq8bvCKA";

          // request the reverse geoding response through the mapbox
          // geocoding api
          $http.get(reverseGeocodingURL).then(function (response) {
            // put the responses "place_name" in variable
            $scope.locationName = response.data.features[2].place_name;
            // console.log(response.data, "Location Name");
            // set the input inside the geocoding search input to the
            // address of where the mouse was clicked on the map
            // geocoder.setInput(locationName === "undefined" ? lat + ", " + lng : locationName);
          });
        },
        function (err) {
          console.log("Profile load error :", err);
        },
      );
    };

    $scope.loadFriends = function (id) {
      UserService.getProfileFriends(id).then(
        function (friends) {
          $scope.friends = friends;
        },
        function (err) {
          console.log("error : ", err);
        },
      );
    };

    $scope.loadUsersEvents = function (id) {
      // get the users events
      EventService.getMyEvents().then(function (events) {
        // put all events in variable
        $scope.usersEvents = events;

        // if user has not chosen a picture for the event
        for (var i = 0; i < $scope.usersEvents.length; i++) {
          // if event has no uploaded image, a generic picture will be assigned to it here
          if ($scope.usersEvents[i].eventImage === undefined) {
            $scope.usersEvents[i].eventImage = "img/noImageAvailable.jpg";
          }

          // this is the city and state variables, they are combined into one new variable, called "place".
          // Here if the city and state variables come as "undefined", the whole address will be displayed instead of just
          // the city and state
          if ($scope.usersEvents[i].location.city === undefined && $scope.usersEvents[i].location.state === undefined) {
            $scope.usersEvents[i].place = $scope.usersEvents[i].location.address1;
          } else {
            $scope.usersEvents[i].place =
              $scope.usersEvents[i].location.city + ", " + $scope.usersEvents[i].location.state;
          }
        }
      });
    };

    $scope.viewEvent = function (event) {
      var id = event._id;
      $state.go("event", { eventId: id });
    };

    $scope.inviteToChat = function () {
      $rootScope.$broadcast("open-chat", $scope.user);
    };

    $scope.addAsFriend = function () {
      UserService.sendFriendRequest($scope.user._id).then(
        function (response) {
          NotificationService.newNotification($scope.user._id, "acceptFriendRequest");
          $scope.user.friend_status = 1;
          console.log("Friend request sent");
        },
        function (response) {
          console.log("Friend request failed");
        },
      );
    };

    $scope.acceptFriendRequest = function () {
      UserService.acceptFriendRequest($scope.user._id).then(
        function (response) {
          NotificationService.newNotification($scope.user._id, "unfriend");
          $scope.user.friend_status = 0;
          console.log("successfully accepted");
        },
        function (response) {
          console.log("Accept failed");
        },
      );
    };

    $scope.unfriendUser = function () {
      UserService.unfriend($scope.user._id).then(
        function (response) {
          NotificationService.newNotification($scope.user._id, "addAsFriend");
          $scope.user.friend_status = -1;
          console.log("successfully unfriended");
        },
        function (response) {
          console.log("Failed to unfriend");
        },
      );
    };

    $scope.clickProfileImage = function () {
      $uibModal.open({
        templateUrl: "photoModal.html",
        size: "lg",
        windowClass: "photoModalDiv",
        resolve: {
          user: function () {
            return $scope.user;
          },
        },
        controller: function ($scope, user, $uibModalInstance) {
          $scope.cancel = function () {
            console.log("ABC");
            $uibModalInstance.close();
          };

          $scope.getImg = function () {
            return user.profile_pic_original;
          };
        },
      });
    };

    socket.on("newNotification", function (data) {
      if (data.type) {
        switch (data.type) {
          case "addAsFriend":
            $scope.user.friend_status = -1;
            break;
          case "acceptFriendRequest":
            $scope.user.friend_status = 2;
            break;
          case "unfriend":
            $scope.user.friend_status = 0;
        }
      }
    });

    $scope.$on("location-updated", function () {
      $scope.init();
    });

    $scope.linkify = function (text) {
      var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
      return text.replace(urlRegex, function (url) {
        return '<a href="' + url + '">' + url + "</a>";
      });
    };
    // this function gets the user's full name and profile picture for status updates
    $scope.getUserName = function (listName) {
      var list;
      if (listName == "statuses") {
        list = $scope.allStatusUpdates;
      } else if (listName == "likes") {
        list = $scope.likes;
      } else {
        return;
      }
      for (var id = 0; id < list.length; id++) {
        const tmp_id = id;
        var profilePic = "";
        UserService.getUserMeta(list[id].from).then(function (info) {
          var fname = info[0].fname;
          var lname = info[0].lname;
          if (!info[0].profile_pic || info[0].profile_pic === "") {
            profilePic = "img/noImageAvailable.jpg";
          } else {
            profilePic = info[0].profile_pic;
          }
          try {
            list[tmp_id].userFullname = fname + " " + lname;
            list[tmp_id].profilePic = profilePic;
          } catch (err) {
            console.log(err);
          }
          if (list[tmp_id].replies) {
            for (var j = 0; j < list[tmp_id].replies.length; j++) {
              const tmp_j = j;
              UserService.getUserMeta(list[tmp_id].replies[j].from).then(function (info) {
                fname = info[0].fname;
                lname = info[0].lname;
                if (!info[0].profile_pic || info[0].profile_pic === "") {
                  profilePic = "img/noImageAvailable.jpg";
                } else {
                  profilePic = info[0].profile_pic;
                }
                try {
                  list[tmp_id].replies[tmp_j].userFullname = fname + " " + lname;
                  list[tmp_id].replies[tmp_j].profilePic = profilePic;
                } catch (err) {
                  console.log(err);
                }
              });
            }
          }
        });
      }
    };

    // this function will only show my friends' status updates
    $scope.showMyStatusUpdates = function () {
      $scope.allStatusUpdates = [];
      $scope.propertyName = "time";

      // gets all statuses
      StatusUpdatesService.getAllStatusUpdates().then(
        function (statuses) {
          if (statuses.length > 0) {
            for (var i = 0; i < statuses.length; i++) {
              if (statuses[i].status.length > 0) {
                for (var j = 0; j < statuses[i].status.length; j++) {
                  $scope.allStatusUpdates.push(statuses[i].status[j]);
                }
              }
            }
          }
          // filters for all statuses created by me
          function checkUser(user) {
            return user.from === $stateParams.USER_ID;
          }

          // filtering
          var statusByUser = $scope.allStatusUpdates.filter(checkUser);

          // concat both above arrays together and puts it in $scope.allStatusUpdates
          $scope.allStatusUpdates = statusByUser;

          // orderBy function is an angular filter that orders item in array, in this case, by time of status
          $scope.allStatusUpdates = orderBy($scope.allStatusUpdates, $scope.propertyName, true);

          // get user's full name and profile pic
          $scope.getUserName("statuses");
        },
        function (err) {
          console.log("status load err: ", err);
        },
      );
    };

    $scope.removeStatus = function (status) {
      StatusUpdatesService.deleteStatus(status._id, status.from).then(function (result) {
        if (!result.success) {
          console.log("status load err: ", result);
          return;
        }

        $scope.allStatusUpdates = $scope.allStatusUpdates.filter(function (el) {
          return el._id !== status._id;
        });

        socket.emit("delete-status", {
          _id: status._id,
        });
      });
    };

    $scope.removeReply = function (reply, status) {
      StatusUpdatesService.deleteReply(reply._id, status._id).then(function (result) {
        if (!result.success) {
          console.log("status load err: ", result);
          return;
        }

        var targetStatus = $scope.allStatusUpdates.filter(function (oStatus) {
          return oStatus._id == status._id;
        })[0];

        targetStatus.replies = targetStatus.replies.filter(function (el) {
          return el._id !== reply._id;
        });

        socket.emit("delete-reply", {
          status_id: status._id,
          reply_id: reply._id,
        });
      });
    };

    $scope.handleKeyDown = function (event, statusId) {
      if (statusId) {
        $("#hidden-comment-" + statusId).val(event.target.value);
      } else {
        $("#status-hidden-input").val(event.target.value);
      }
    };

    // create new status
    $scope.newStatus = function (event, msg) {
      msg = $("#status-hidden-input").val();
      if (msg == "" && !$scope.upload) {
        console.log("nothing was typed");
      } else {
        $scope.status = {
          user: $rootScope.sess._id,
          message: {
            status_type: "text",
            message: msg,
          },
        };

        var timeOfStatus = Date.now();

        var data = {
          status_type: $scope.status.message.status_type,
          time: timeOfStatus,
          from: $scope.status.user,
          userFullname: $rootScope.sess.fname + " " + $rootScope.sess.lname,
          likes: [],
          profilePic: $rootScope.sess.profile_pic,
        };

        if ($scope.upload) {
          data.status_type = $scope.upload.type;
          data.filename = $scope.upload.src;
          data.caption = $scope.status.message.message;
        } else {
          data.message = $scope.status.message.message;
        }

        // send new status-update to database through service
        StatusUpdatesService.postNewStatus(data).then(function (result) {
          // add new status update to local array to show immediately
          $scope.allStatusUpdates.unshift({
            _id: result.status[0]._id,
            message: result.status[0].message,
            caption: result.status[0].caption,
            status_type: result.status[0].status_type,
            time: result.status[0].time,
            from: result.status[0].from,
            userFullname: $rootScope.sess.fname + " " + $rootScope.sess.lname,
            likes: result.status[0].likes,
            profilePic: $rootScope.sess.profile_pic,
          });

          // broadcast new status update to other users and to save to database
          socket.emit("new-status-update", {
            _id: result.status[0]._id,
            message: result.status[0].message,
            caption: result.status[0].caption,
            status_type: result.status[0].status_type,
            time: result.status[0].time,
            from: result.status[0].from,
            userFullname: $rootScope.sess.fname + " " + $rootScope.sess.lname,
            likes: result.status[0].likes,
            profilePic: $rootScope.sess.profile_pic,
          });
        });

        event.target.value = "";
        $scope.status.message = {};
        $scope.upload = null;
        $("#status-hidden-input").val("");
      }
    };

    // create new status
    $scope.newReply = function (event, status, msg) {
      msg = $("#hidden-comment-" + status._id).val();
      if (event.which === 13) {
        if (msg == "") {
          console.log("nothing was typed");
        } else {
          var timeOfStatus = Date.now();

          var data = {
            status_id: status._id,
            message: msg,
            reply_type: "text",
            time: timeOfStatus,
            from: $rootScope.sess._id,
            userFullname: $rootScope.sess.fname + " " + $rootScope.sess.lname,
            profilePic: $rootScope.sess.profile_pic,
            caption: "",
            _id: null,
          };

          socket.emit("add-reply", data);

          event.target.value = "";
          $scope.status.reply = {};
          $("#hidden-comment-" + status._id).val("");
        }
      }
    };

    $scope.init();
  },
]);
