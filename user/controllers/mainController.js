"use strict";
//for main controller you can define any thing to make one way binding in main view.

ibouge.controller("MainController", [
  "$scope",
  "$state",
  "$rootScope",
  "$timeout",
  "$http",
  "$uibModal",
  "UserService",
  "NotificationService",
  "MicroblogService",
  "SocketFactory",
  "$location",
  function (
    $scope,
    $state,
    $rootScope,
    $timeout,
    $http,
    $uibModal,
    UserService,
    NotificationService,
    MicroblogService,
    SocketFactory,
    $location,
  ) {
    var socket = SocketFactory.connection;

    socket.on("new-notification-to-show", function (event) {
      $scope.notifications.hasNewMessage = true;
      $scope.$apply();
    });

    // whenever the url changes
    $scope.$on("$locationChangeSuccess", function (event) {
      // variable is used in a conditional in
      // index.html to see whether the user has
      // clicked on their "My Profile" button in the header
      $scope.urlUser = $location.url();
    });

    // if the user has been checked and is valid by
    // AuthService then there will be a $rootScope.sess
    // if there is a $rootScope.sess
    if ($rootScope.sess && angular.isObject($rootScope.sess)) {
      // get the socket connection to the server
      var socket = SocketFactory.connection;

      // send the clients ID to the socket on the server side
      socket.emit("addUserID", { id: $rootScope.sess._id });

      // load the meta data
      // especially important
      // for notifications
      $scope.loadMeta();
    }

    $scope.state = null;
    $scope.inbox = {
      isOpen: false,
      hasNewMessage: false,
      data: [],
      unread: 0,
    };

    $scope.notifications = {
      isOpen: false,
      hasNewMessage: false,
      data: [],
    };

    $scope.search = {
      timer: 0,
      results: [],
    };

    $rootScope.readChatMessages = [];

    $rootScope.$on("$stateChangeSuccess", function (event, toState, toParams, fromState, fromParams) {
      if (
        toState.name === "login" ||
        toState.name === "register" ||
        toState.name === "restorepassword" ||
        toState.name === "newpassword" ||
        toState.name.indexOf("profilesetup") === 0
      ) {
        $scope.showToolbar = false;
      } else {
        $scope.showToolbar = true;
      }

      if (toState.name === "home" || toState.name === "mapOSM" || toState.name === "mapOverview") {
        $scope.showFooter = false;
      } else {
        $scope.showFooter = true;
      }

      $scope.state = toState.name;
    });

    $scope.signout = function () {
      $rootScope.signout();
    };

    $scope.getProfilePic = function (img) {
      return UserService.getProfilePic(img);
    };

    $scope.doSearch = function (q) {
      $timeout.cancel($scope.search.timer);
      $scope.search.timer = $timeout(function () {
        if (!q || q.trim() == "") {
          $scope.search.results = [];
        } else {
          $http.get("/filter?q=" + q).then(
            function (response) {
              $scope.search.results = response.data.users;
            },
            function (response) {
              // console.log('error', response.data);
            },
          );
        }
      }, 500);
    };

    $scope.inboxToggle = function (isOpen) {
      //   console.log("InboxToggle");
      $scope.loadInbox();
      //   if (isOpen) {
      //     console.log("isOpen");
      //   }
    };

    $scope.loadInbox = function () {
      var meta = null;
      $scope.inbox.unread = 0;
      UserService.loadInbox().then(
        function (data) {
          $scope.inbox.data = data;
          console.log(data, "inbox data");
          // if there are open P2P chats
          // go compare each chat inside the inbox with each of the open
          // P2P chats. If there is a match then add the "isOpen = true" element
          // to the $scope.inbox.data object so that the ReadUnreadFilter can know
          // whether or not P2P chat is open and there mark the particular inbox
          // chat as read rather than unread
          if ($rootScope.openP2PChats.length > 0) {
            for (var j = 0; j < $scope.inbox.data.length; j++) {
              var openP2PChat = $scope.inbox.data.find(function (currentChat) {
                for (var i = 0; i < $rootScope.openP2PChats.length; i++) {
                  if (currentChat.room === $rootScope.openP2PChats[i].room) {
                    currentChat.isOpen = true;
                  }
                }
              });
            }
          }

          for (var id = 0; id < $scope.inbox.data.length; id++) {
            const tmp_id = id;
            UserService.getUserMeta($scope.inbox.data[id].messages[0].from).then(function (info) {
              var name = info[0].fname;
              // name = name[0].toUpperCase() + name.slice(1);
              $scope.inbox.data[tmp_id].messages[0].from = name;
              $scope.inbox.data[tmp_id].messages[0].from_id = info[0]._id;

              if ($scope.inbox.data[tmp_id].messages[0].from_id != $rootScope.sess._id) {
                if ($scope.inbox.data[tmp_id].messages[0].read_at) {
                  $scope.inbox.data[tmp_id].is_read = true;
                } else {
                  $scope.inbox.data[tmp_id].is_read = false;
                }
              } else {
                $scope.inbox.data[tmp_id].is_read = true;
              }

              if ($scope.inbox.data[tmp_id].is_read !== true) {
                $scope.inbox.unread += 1;
              }
            });
          }
        },
        function () {},
      );
    };

    $scope.$on("presence", function (event, presenceData) {
      if ($scope.inbox.data[0] && $scope.inbox.data[0].users) {
        for (var j = 0; j < $scope.inbox.data.length; j++) {
          for (var i = 0; i < $scope.inbox.data[j].users.length; i++) {
            if ($scope.inbox.data[j].users[i].user_id == presenceData.user_id) {
              $scope.$apply(function () {
                $scope.inbox.data[j].is_online = presenceData.status;
              });
              break;
            }
          }
        }
      }
    });

    $scope.goToChat = function (item) {
      if (item.is_group_chat === true) {
        $scope.inbox.unread--;
        if ($scope.inbox.unread > 0) {
          $scope.inbox.hasNewMessage = true;
        } else {
          $scope.inbox.hasNewMessage = false;
        }
        NotificationService.openGroupChat(item);
      } else {
        if (item.users[0].user_id === $rootScope.sess._id) {
          UserService.getUserProfile(item.users[1].user_id).then(function (user) {
            $scope.inbox.unread--;
            if ($scope.inbox.unread > 0) {
              $scope.inbox.hasNewMessage = true;
            } else {
              $scope.inbox.hasNewMessage = false;
            }
            $rootScope.$broadcast("open-chat", user);
          });
        } else {
          UserService.getUserProfile(item.users[0].user_id).then(function (user) {
            $scope.inbox.unread--;
            if ($scope.inbox.unread > 0) {
              $scope.inbox.hasNewMessage = true;
            } else {
              $scope.inbox.hasNewMessage = false;
            }
            $rootScope.$broadcast("open-chat", user);
          });
        }
      }
    };

    $scope.notificationsToggle = function (isOpen) {
      //   if (isOpen) {
      $scope.notifications.hasNewMessage = false;
      $scope.loadNotifications();
      //   }
    };

    $scope.loadNotifications = function () {
      UserService.loadNotifications().then(
        function (notifications) {
          $scope.notifications.data = notifications;
        },
        function (err) {
          console.log("notifications load err :", err);
        },
      );
    };

    $scope.openNotification = function (notification) {
      switch (notification.type) {
        case "create-group-chat":
          NotificationService.openGroupChat(notification);
          break;
        case "friend-request":
          $state.go("profile", { USER_ID: notification.meta[0].value });
          break;
        case "accept-friend-request":
          $state.go("profile", { USER_ID: notification.meta[0].value });
          break;
        case "like-request":
          $state.go("dashboard", { POST_ID: notification.meta[1].value });
          break;
        case "invite-friend-to-microblog":
          var room = null;
          var creator = notification.meta
            .filter(function (item) {
              return item.key == "created_by";
            })
            .map(function (item) {
              return item.value;
            });

          if (notification.is_microblog == true) {
            room = notification.room;
          } else {
            room = notification.meta
              .filter(function (item) {
                return item.key == "room";
              })
              .map(function (item) {
                return item.value;
              });

            room = room && room.length > 0 ? room[0] : null;
          }

          MicroblogService.getMicroblogForInvitee(room, creator).then(function (microblog) {
            $scope.openMicroblogModal(microblog);
          });
          break;
      }
    };

    $scope.openMicroblogModal = function (microblog) {
      $state.go("home");
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

    $scope.loadMeta = function () {
      UserService.loadMeta().then(
        function (metaData) {
          console.log(metaData, "User Meta data");
          // load notification/inbox status
          $scope.inbox.hasNewMessage = metaData.new_inbox;
          $scope.notifications.hasNewMessage = metaData.new_notification;
        },
        function (err) {
          console.log("load meta error :", err);
        },
      );
    };

    $scope.$on("new-notification", function () {
      if ($scope.notifications.isOpen) {
        $scope.loadNotifications();
      } else if ($scope.inbox.isOpen) {
        $scope.loadNotifications();

        $scope.loadInbox();
      } else {
        $scope.loadMeta();
      }
    });

    $scope.$on("message", function (event, args) {
      if ($scope.inbox.isOpen) {
        $scope.loadInbox();
      } else if (
        args.typeOfChat === "isGroupChat" &&
        !$scope.inbox.isOpen &&
        NotificationService.groupChatModalIsOpen.isOpen !== true
      ) {
        $scope.loadMeta();
      } else if (
        args.groupChatRoom !== NotificationService.groupChatModalIsOpen.roomNumber &&
        args.typeOfChat === "isGroupChat"
      ) {
        $scope.loadMeta();
      }
    });

    $scope.setTrue = function (tab) {
      switch (tab) {
        case "account":
          $rootScope.profileTab = false;
          $rootScope.account = true;
          $rootScope.privacy = false;
          $rootScope.notificationsTab = false;
          break;
        case "privacy":
          $rootScope.profileTab = false;
          $rootScope.account = false;
          $rootScope.privacy = true;
          $rootScope.notificationsTab = false;
          break;
        case "notifications":
          $rootScope.profileTab = false;
          $rootScope.account = false;
          $rootScope.privacy = false;
          $rootScope.notificationsTab = true;
          break;
        default:
          $rootScope.makeFalse();
      }
    };

    $rootScope.makeFalse = function () {
      $rootScope.account = false;
      $rootScope.privacy = false;
      $rootScope.notificationsTab = false;
    };

    $scope.$on("location-updated", function () {
      // load meta data
      $scope.loadMeta();
    });
  },
]);
