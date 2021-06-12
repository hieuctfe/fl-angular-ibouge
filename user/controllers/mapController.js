"use strict";

ibouge.controller("MapController", [
  "$scope",
  "$rootScope",
  "MicroblogService",
  "$uibModal",
  "$state",
  "SocketFactory",
  "MapOSMService",
  "UserService",
  function ($scope, $rootScope, MicroblogService, $uibModal, $state, SocketFactory, MapOSMService, UserService) {
    $scope.cityClicked = false;

    // variables to ensure which icons and info
    // are viewable, microblogs or users
    $scope.viewUsers = true;
    $scope.viewMicroblogs = false;
    $scope.viewEvents = false;
    $scope.usersClicked = true;
    $scope.microblogsClicked = false;
    $scope.eventsClicked = false;
    $scope.clickIconName = "user";

    // get socket connection to the server
    var socket = SocketFactory.connection;

    socket.on("new-notification-to-show", function (event) {
      $scope.notifications.hasNewMessage = true;
      $scope.$apply();
    });

    // to broadcast changes to directive so icons and appear
    // and disappear when mouse events are fired
    function broadcast(mouseEvent, callback) {
      $rootScope.$broadcast("mapIconEventMapOverview", { broadcastID: mouseEvent });
      callback();
    }

    function broadcastLeavingIcon(mouseEvent, whichIconIsClicked, callback) {
      $rootScope.$broadcast("mapIconEventMapOverview", { broadcastID: mouseEvent, clickedIcon: whichIconIsClicked });
      callback();
    }

    $scope.mouseEvent = function (mouseEvent) {
      switch (mouseEvent) {
        case "mouseOverMicroblogIcon":
          if ($scope.microblogsClicked === false) {
            broadcast("mouseOverMicroblogIcon", function () {
              $scope.viewMicroblogs = true;
              $scope.viewUsers = false;
              $scope.viewEvents = false;
            });
          }
          break;
        case "mouseLeaveMicroblogIcon":
          if ($scope.microblogsClicked === false) {
            broadcastLeavingIcon("mouseLeaveMicroblogIcon", $scope.clickIconName, function () {
              $scope.viewMicroblogs = false;

              $scope.eventsClicked ? ($scope.viewEvents = true) : ($scope.viewUsers = true);
            });
          }
          break;
        case "mouseClickMicroblogIcon":
          broadcast("mouseClickMicroblogIcon", function () {
            $scope.clickIconName = "microblog";

            $scope.microblogsClicked = true;
            $scope.usersClicked = false;
            $scope.eventsClicked = false;
          });
          break;
        case "mouseOverUserIcon":
          if ($scope.usersClicked === false) {
            broadcast("mouseOverUserIcon", function () {
              $scope.viewUsers = true;
              $scope.viewMicroblogs = false;
              $scope.viewEvents = false;
            });
          }
          break;
        case "mouseLeaveUserIcon":
          if ($scope.usersClicked === false) {
            broadcastLeavingIcon("mouseLeaveUserIcon", $scope.clickIconName, function () {
              $scope.viewUsers = false;

              $scope.eventsClicked ? ($scope.viewEvents = true) : ($scope.viewMicroblogs = true);
            });
          }
          break;
        case "mouseClickUserIcon":
          broadcast("mouseClickUserIcon", function () {
            $scope.clickIconName = "user";

            $scope.usersClicked = true;
            $scope.microblogsClicked = false;
            $scope.eventsClicked = false;
          });
          break;
        case "mouseOverEventIcon":
          if ($scope.eventsClicked === false) {
            broadcast("mouseOverEventIcon", function () {
              $scope.viewEvents = true;
              $scope.viewUsers = false;
              $scope.viewMicroblogs = false;
            });
          }
          break;
        case "mouseLeaveEventIcon":
          if ($scope.eventsClicked === false) {
            broadcastLeavingIcon("mouseLeaveEventIcon", $scope.clickIconName, function () {
              $scope.viewEvents = false;

              $scope.microblogsClicked ? ($scope.viewMicroblogs = true) : ($scope.viewUsers = true);
            });
          }
          break;
        case "mouseClickEventIcon":
          broadcast("mouseClickEventIcon", function () {
            $scope.clickIconName = "event";

            $scope.eventsClicked = true;
            $scope.usersClicked = false;
            $scope.microblogsClicked = false;
          });
          break;
      }
    };

    //        ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
    // !!! IF MOUSE IS OVER, LEAVES OR CLICKS MICROBLOGS MAIN ICON !!!

    $scope.$on("currentMicroblogs", function (event, microblogs) {
      // $apply ensures the microblogs are updated in the view
      // every time the variable changes
      $scope.$apply(function () {
        // var to hold all final microblogs info
        // to be used in the view
        $scope.allMicroblogs = [];

        // number of current microblogs on the map
        $scope.numberOfMicroblogs = microblogs.currentMicroblogs.length;

        // iterate through all microblogs and places necessary
        // info into the allMicroblogs variable
        for (var i = 0; i < $scope.numberOfMicroblogs; i++) {
          $scope.allMicroblogs.push({
            room: microblogs.currentMicroblogs[i].room,
            creator: microblogs.currentMicroblogs[i].created_by,
            microblogImg: microblogs.currentMicroblogs[i].microblog_img,
            users: microblogs.currentMicroblogs[i].users.length,
            title: microblogs.currentMicroblogs[i].name,
            date: microblogs.currentMicroblogs[i].created_date,
          });
        }
      });
    });

    // $apply ensures the microblogs are updated in the view
    // every time the variable changes
    $scope.$on("currentUsers", function (event, users) {
      $scope.$apply(function () {
        // var to hold all final users info
        // to be used in the view
        $scope.allUsers = [];

        // number of current users
        $scope.numberOfUsers = users.currentUsers.length;

        // iterate through all users and places necessary
        // info into the allUsers variable
        for (var i = 0; i < $scope.numberOfUsers; i++) {
          $scope.allUsers.push({
            dateOfBirth: Math.floor((new Date() - new Date(users.currentUsers[i].dob)) / 31536000000),
            userID: users.currentUsers[i]._id,
            profilePic: users.currentUsers[i].profile_pic,
            firstName: users.currentUsers[i].fname,
            lastName: users.currentUsers[i].lname,
            online: users.currentUsers[i].is_online,
            gender: UserService.getGenderAbbrev(users.currentUsers[i].gender),
            interests: users.currentUsers[i].profile.interests,
          });
        }
      });
    });

    // $apply ensures the events are updated in the view
    // every time the variable changes
    $scope.$on("currentEvents", function (event, events) {
      $scope.$apply(function () {
        // var to hold all final events info
        // to be used in the view
        $scope.allEvents = [];

        $scope.totalIbougeEvents = events.currentEvents;

        // number of current events
        $scope.numberOfEvents = events.currentEvents.length;

        // iterate through all events and places necessary
        // info into the allUsers variable
        for (var i = 0; i < $scope.numberOfEvents; i++) {
          // will hold image url
          var image = "";

          // if there is an image, get the correct url for that image
          if (events.currentEvents[i].eventImage === undefined) {
            events.currentEvents[i].eventImage = "img/noImageAvailable.jpg";
          }

          $scope.allEvents.push({
            category: events.currentEvents[i].category,
            dateOfEvent: new Date(events.currentEvents[i].dateOfEvent).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            eventEndTime: new Date(events.currentEvents[i].eventEndTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            eventStartTime: new Date(events.currentEvents[i].eventStartTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            usersWhoAreGoing: events.currentEvents[i].going,
            location: events.currentEvents[i].location,
            name: events.currentEvents[i].name,
            eventImage: events.currentEvents[i].eventImage,
            id: events.currentEvents[i]._id,
          });
        }
      });
    });

    // function to take interest out of an array
    // and make them conducive for the view
    $scope.getInterests = function (arr) {
      if (!arr || arr.length === 0) {
        return "";
      }

      var interests = "";
      for (var i = 0; i < arr.length; i++) {
        if (i === arr.length - 1) {
          interests += arr[i];
        } else {
          interests += arr[i] + ", ";
        }
      }

      return interests.trim();
    };

    $scope.$on("cityClicked", function () {
      $scope.cityClicked = true;
    });

    // This opens a microblog
    $scope.openMicroblogModal = function (microblog) {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: "microblog.html",
        controller: "MicroblogController",
        resolve: {
          microblogToOpen: function () {
            return microblog;
          },
        },
      });
      modalInstance.result.then(
        function (data) {},
        function (data) {},
      );
    };

    // this function is called when choosing which microblog to open
    $scope.openMicroblog = function (microblog) {
      var data = {
        user: $rootScope.sess._id,
        room: microblog.room,
      };
      socket.emit("add-me-to-allInvolved", data);
      MicroblogService.getMicroblog(microblog.room).then(
        function (microblog) {
          $scope.openMicroblogModal(microblog);
        },
        function (err) {
          console.log("could not get microblog", err);
        },
      );
    };
  },
]);
