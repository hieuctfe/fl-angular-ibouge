"use strict";

ibouge.directive("ibgChat", [
  "$rootScope",
  "$compile",
  "$http",
  "$q",
  "UserService",
  "ChatService",
  "SocketFactory",
  "$filter",
  function ($rootScope, $compile, $http, $q, UserService, ChatService, SocketFactory, $filter) {
    return {
      restrict: "E",
      templateUrl: "chat.html",
      scope: {},
      link: function (scope, element) {
        scope.US = UserService;
        scope.chats = [];
        scope.typing = false;
        // global variable to hold which P2P chats are open
        $rootScope.openP2PChats = [];

        // watches the scope.chats array to see when elements are
        // added and takes off the array
        scope.$watchCollection("chats", function (newCollection, oldCollection) {
          // adds only the open P2P chats to the global
          // variable so it can be used for the inbox
          // read and unread when the inbox is loaded
          $rootScope.openP2PChats = newCollection;
        });

        // get the sockets connection to server
        var socket = SocketFactory.connection;

        scope.init = function () {
          if (socket._callbacks.$message === undefined) {
            socket.on("message", function (data) {
              // scope.typing = false;
              scope.showMessageInChat(data);
              $rootScope.$broadcast("message", { typeOfChat: "personToPerson" });
            });
          }

          socket.on("typing", function (data) {
            console.log("socket for typing", data);
            scope.typing = true;
            $rootScope.$broadcast("check-and-scroll-to-bottom-" + data.room);
            setTimeout(function () {
              scope.typing = false;
            }, 3000);
          });

          if (socket._callbacks.$loadP2PChatHistory === undefined) {
            socket.on("loadP2PChatHistory", function (data) {
              var chat = scope.getChat("room", data.room);
              if (chat) {
                scope.loadChatHistory(chat).then(
                  function () {
                    scope.scrollToBottom(chat.room);
                  },
                  function () {},
                );
              }
            });
          }
        };

        scope.$on("presence", function (event, presenceData) {
          for (var i = 0; i < scope.chats.length; i++) {
            if (scope.chats[i].friends._id == presenceData.user_id) {
              scope.$apply(function () {
                scope.chats[i].friends.is_online = presenceData.status;
              });
            }
          }
        });

        scope.getChat = function (key, value) {
          for (var i = 0; i < scope.chats.length; i++) {
            if (scope.chats[i][key] === value) {
              return scope.chats[i];
            }
          }

          return null;
        };

        scope.linkify = function (text) {
          var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
          return text.replace(urlRegex, function (url) {
            console.log(url);
            return '<a href="' + url + '">' + url + "</a>";
          });
        };

        scope.showMessageInChat = function (data) {
          var chat = scope.getChat("room", data.room);
          if (chat) {
            // chat exists
            chat.messages.push({
              in: true,
              from: data.from,
              time: data.time,
              msg: data.msg,
              id: data._id,
            });
            chat.offset++;
            $rootScope.$broadcast("check-and-scroll-to-bottom-" + chat.room);
            scope.$apply();
          } else {
            // new chat
            UserService.getUser(data.from).then(
              function (response) {
                scope.openChat(response.data);
              },
              function (response) {
                console.log("error");
              },
            );
          }

          var url = "/chat/read/" + data.room;
          $http.get(url).then(
            function (response) {},
            function (response) {
              console.log("error while setting read status: " + response);
            },
          );
        };

        scope.sendMsgOnEnter = function (event, msg, chat) {
          if (event.which === 13) {
            msg = $("#hidden-chat-" + chat.room).val();
            $("#hidden-chat-" + chat.room).val("");
            scope.chatMessage = "";
            scope.sendMessage(msg, chat);
          } else {
            var me = $rootScope.sess._id;
            socket.emit("typing", { room: chat.room, from: me, to: chat.friends._id, msg: msg, time: Date.now() });
            $("#hidden-chat-" + chat.room).val(event.target.value);
          }
        };

        scope.sendMessage = function (msg, chat) {
          if (!msg || msg.trim() === "") {
            return;
          }

          msg = msg.trim();
          chat.chatMessage = null;
          if (socket) {
            var me = $rootScope.sess._id;
            if (chat.isGroupChat) {
              socket.emit("group-message", { room: chat.room, from: me, msg: msg });
            } else {
              socket.emit("message", { room: chat.room, from: me, to: chat.friends._id, msg: msg, time: Date.now() });
            }
            chat.messages.push({ in: false, from: me, time: Date.now(), msg: msg });
            chat.offset++;
            $rootScope.$broadcast("check-and-scroll-to-bottom-" + chat.room);
          }
        };

        scope.$on("open-chat", function (event, user) {
          scope.openChat(user);
        });

        scope.openChat = function (users, room) {
          var chat = null;
          if (!room && angular.isObject(users)) {
            chat = scope.createRoom(users);
          } else if (room && angular.isArray(users)) {
            chat = scope.createRoom(users, room);
          }
          if (chat) {
            // join the socket.io room
            // when the chat is opened
            socket.emit("join-room", {
              room: chat.room,
            });

            socket.emit("open-chat", {
              id: chat.me._id,
              room: chat.room,
              isGroupChat: false,
            });
          }
        };

        scope.createRoom = function (friends, room) {
          var isGroupChat = false;
          if (room) {
            isGroupChat = true;
          } else {
            room = scope.generateRoomName($rootScope.sess._id, friends._id);
          }
          if (!scope.getChat("room", room)) {
            var chat = {
              isGroupChat: isGroupChat,
              me: $rootScope.sess,
              friends: friends,
              room: room,
              limit: 20,
              offset: 0,
              messages: [],
            };
            scope.chats.push(chat);
            return chat;
          }
          return null;
        };

        scope.generateRoomName = function (me, friend) {
          return me < friend ? me + "___" + friend : friend + "___" + me;
        };

        scope.loadChatHistory = function (chat) {
          var deferred = $q.defer();
          var id = chat.me._id;
          var url = "/chat/history/" + chat.room;
          url += "?limit=" + chat.limit + "&offset=" + chat.offset + "&id=" + $rootScope.sess._id;
          $http.get(url).then(
            function (response) {
              var messages = response.data.map(function (item) {
                let readAt = "unread";
                if (item.read_at) {
                  readAt = "Read at: " + $filter("date")(item.read_at, "hh:mm a - MMM dd, yyyy");
                }
                var chatMsg = {
                  from: item.from,
                  time: item.time,
                  read_at: readAt,
                  msg: item.message ? scope.linkify(item.message) : "",
                };
                chatMsg.in = item.from !== id;
                return chatMsg;
              });
              for (var i = 0; i < messages.length; i++) {
                chat.messages.unshift(messages[i]);
              }
              chat.offset += messages.length;
              if (messages[0].from != $rootScope.sess._id && !messages[0].read_at) {
                url = "/chat/read/" + chat.room;
                $http.get(url).then(
                  function (response) {},
                  function (response) {
                    console.log("error while setting read status: " + response);
                  },
                );
              }
            },
            function (response) {
              deferred.reject();
            },
          );
          return deferred.promise;
        };

        scope.loadMore = function (room) {
          var chat = scope.getChat("room", room);
          if (chat) {
            scope.loadChatHistory(chat);
          }
        };

        scope.scrollToBottom = function (room) {
          $rootScope.$broadcast("scroll-to-bottom-" + room);
        };

        scope.closeChat = function (chat) {
          var index = scope.chats.indexOf(chat);
          if (index > -1) {
            // leave the chat room
            // when the chat is x'd
            // off the screen
            socket.emit("leave-room", {
              room: chat.room,
            });

            socket.emit("close-chat", { id: chat.me._id, room: chat.room });
            scope.chats.splice(index, 1);
          }
        };

        scope.getFromImage = function (from, chat) {
          for (var i = 0; i < chat.friends.length; i++) {
            if (chat.friends[i].user_id === from) {
              return UserService.getProfilePic(chat.friends[i].profile_pic);
            }
          }
          return "";
        };

        scope.$on("location-updated", function () {
          scope.init();
        });

        // when the user signs out close all
        // of the p2p chat windows
        scope.$on("signout", function (event) {
          while (scope.chats.length > 0) {
            scope.closeChat(scope.chats[0]);
          }
        });

        // when the page is refreshed
        scope.$on("refresh", function (event, args) {
          // if there are open P2P chats
          if (args.chats.length > 0) {
            for (var i = 0; i < args.chats.length; i++) {
              //leave room(socket) on the server
              socket.emit("leave-room", {
                room: args.chats[i].room,
              });
            }

            // set the last login info to the server
            socket.emit("on-refresh-p2p-chat", {
              chats: args.chats,
            });
          }
        });

        scope.init();
      },
    };
  },
]);
