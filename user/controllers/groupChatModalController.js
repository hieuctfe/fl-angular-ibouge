'use strict';

ibouge.controller('GroupChatModalController', ['$scope', '$rootScope', '$compile', '$http', '$q', 'UserService','$timeout', 'ChatService', 'SocketFactory', 'NotificationService', 'usSpinnerService', function($scope, $rootScope, $compile, $http, $q, UserService, $timeout, ChatService, SocketFactory, NotificationService, usSpinnerService) {
    $scope.ctrl = {
        show: false
    };
    $scope.US = UserService;
    $scope.chats = [];
    $scope.File = {};
    $scope.isFileSelected = false;
    $scope.imageInfo = {};

    // global variable to hold which Group chats are open
    $rootScope.openGroupChats = [];

    // watches the $scope.chats array to see when elements are
    // added and taken off the array
    $scope.$watchCollection('chats', function (newCollection, oldCollection) {

        // adds only the open Group chats to the global
        // variable so it can be used for the inbox
        // read and unread when the inbox is loaded
        $rootScope.openGroupChats = newCollection;
    });

    // get the sockets connection to the server
    var socket = SocketFactory.connection;
    socket.on('new-notification-to-show', function(event) {
        $scope.notifications.hasNewMessage = true;
        $scope.$apply();
    });

    $scope.init = function() {

        if(socket._callbacks.$groupMessage === undefined) {
            socket.on('groupMessage', function(data) {
                $rootScope.$broadcast('message', { typeOfChat: 'isGroupChat', groupChatRoom: data.room });
                $scope.showGroupMessageInChat(data);
            });
        }

        if(socket._callbacks.$loadGroupChatHistory === undefined) {

            socket.on('loadGroupChatHistory', function(data) {
                var chat = $scope.getChat('room', data.room);
                if (chat) {
                    $scope.loadChatHistory(chat).then(function() {
                        $scope.scrollToBottom(chat.room);
                    }, function() {
                    });
                }
            });
        }

        if(socket._callbacks.$groupChatImageMessage ===  undefined) {

            socket.on('groupChatImageMessage', function(data) {
                $scope.showImageMessageInGroupChat(data);
            });
        }
    };

    $scope.getChat = function(key, value) {
        for (var i = 0; i < $scope.chats.length; i++) {
            if ($scope.chats[i][key] === value) {
                return $scope.chats[i];
            }
        }

        return null;
    };

    $scope.showMessageInChat = function(data) {
        var chat = $scope.getChat('room', data.room);
        if (chat) {
            // chat exists
            chat.messages.push({in: true, from: data.from, time: data.time, msg: data.msg});
            chat.offset++;
            $rootScope.$broadcast('check-and-scroll-to-bottom-' + chat.room);
            $scope.$apply();
        } else {
            // new chat
            UserService.getUser(data.from).then(function(response) {
                $scope.openChat(response.data);
            }, function(response) {
                console.log('error');
            });
        }
    };

    $scope.showGroupMessageInChat = function(data) {
        var chat = $scope.getChat('room', data.room);
        if (chat) {
            // chat exists
            chat.messages.push({in: true, from: data.from, time: data.time, msg: data.msg});
            chat.offset++;
            $rootScope.$broadcast('check-and-scroll-to-bottom-' + chat.room);
            $scope.$apply();
        } else {

            if (NotificationService.groupChatModalIsOpen.isOpen !== true) {
                // new chat
                ChatService.getChat(data.room).then(function(_chat) {
                    $scope.openChat(_chat.users, _chat.room);
                }, function(err) {
                    console.log('get chat failed :', err);
                })
            }
        }
    };

    $scope.showImageMessageInGroupChat = function(data){
        var chat = $scope.getChat('room', data.room);
        if (chat) {
            var isNewDay = false;
            if (chat.messages.length === 0) {
                isNewDay = true;
            } else if (chat.messages.length > 0) {
                var lastMessageTime = new Date(chat.messages[chat.messages.length - 1].time).setHours(0, 0, 0, 0);
                var todaysDate = new Date(Date.now()).setHours(0, 0, 0, 0);

                if (lastMessageTime === todaysDate) {
                    isNewDay = false;
                } else if (lastMessageTime !== todaysDate) {
                    isNewDay = true;
                }
            }

            if ( chat.messages.length === 0) {
                chat.messages.push({in: true, isImage: data.isImage, isFirstMsg: true, isNewDay: isNewDay, from: data.from, time: data.time, msg: data.msg, src: data.src, ownMsg: false});
                chat.offset++;
                $rootScope.$broadcast('check-and-scroll-to-bottom-' + chat.room);
                $scope.$apply();
            } else if (chat.messages.length > 0) {
                chat.messages.push({in: true, isImage: data.isImage, isFirstMsg: false, isNewDay: isNewDay, from: data.from, time: data.time, msg: data.msg, src: data.src, ownMsg: false});
                chat.offset++;
                $rootScope.$broadcast('check-and-scroll-to-bottom-' + chat.room);
                $scope.$apply();
            }
        }
    };

    // sending new images function
    $scope.handleImageFileSelect = function (evt) {
        $scope.File = evt.currentTarget.files[0];
        var chatRoom = evt.currentTarget.id;

        // name of the album to save to in the amazon bucket
        var albumName = 'group-chat-image-messages';

        // form to send to router
        var fd = new FormData();
        fd.append('albumName', albumName);
        fd.append('file', $scope.File);
        fd.append('chatRoom', chatRoom);
        fd.append('message_type', "image");
        fd.append('message', "");
        fd.append('from', $rootScope.sess._id);

        // start the loading spinner
        usSpinnerService.spin('spinner-3');

        // make an http post request to save image to bucket and save message in DB
        $http.post("chat/group/upload-image-message", fd, {
            transformRequest: angular.identity,
            headers: { 'Content-Type': undefined }
        }).then(function (response) {

            // stop the spinner once we get a response
            usSpinnerService.stop('spinner-3');

            // get chat
            var chat = $scope.getChat('room', chatRoom);

            var me = $rootScope.sess._id;

            // info about the image message to send to friends in chat asynchronously
            var groupChatImgMsg = {
                isImage: true,
                from: me,
                time: response.data.messages[0].time,
                msg: response.data.messages[0].message,
                src: response.data.messages[0].message,
                room: chat.room
            };

            // send image message info to friends in chat
            socket.emit("group-chat-image-message", chat.room, groupChatImgMsg);

            // calculate weather date of this new message is of the same day as last message or it is a new day
            var isNewDay = false;
            if ( chat.messages.length === 0) {
                isNewDay = true;
            } else if (chat.messages.length > 0) {
                var lastMessagesTime = new Date(chat.messages[chat.messages.length - 1].time).setHours(0,0,0,0);
                var todaysDate = new Date(Date.now()).setHours(0,0,0,0);

                if (lastMessagesTime === todaysDate){
                    isNewDay = false;
                } else if (lastMessagesTime !== todaysDate){
                    isNewDay = true;
                }
            }

            // push message to local array to show immediately in my feed
            if ( chat.messages.length === 0) {
                chat.messages.push({in: false, isImage: true, isFirstMsg: true, isNewDay: isNewDay, from: me, time: response.data.messages[0].time, msg: response.data.messages[0].message, src: response.data.messages[0].message, ownMsg: true});
                chat.offset++;
                $rootScope.$broadcast('check-and-scroll-to-bottom-' + chat.room);
            } else if (chat.messages.length > 0) {
                chat.messages.push({in: false, isImage: true, isFirstMsg: false, isNewDay: isNewDay, from: me, time: response.data.messages[0].time, msg: response.data.messages[0].message, src: response.data.messages[0].message, ownMsg: true});
                chat.offset++;
                $rootScope.$broadcast('check-and-scroll-to-bottom-' + chat.room);
            }
        });
    };


    $scope.sendMsgOnEnter = function(event, msg, chat) {
        if (event.which === 13) {
            msg = $("#hidden-group-chat-" + chat.room).val();
            $("#hidden-group-chat-" + chat.room).val("");
            $scope.chatMessage = "";
            $scope.sendMessage(msg, chat);
        } else {
            $("#hidden-group-chat-" + chat.room).val(event.target.value);
        }
    };

    $scope.sendMessage = function(msg, chat) {
        if (!msg || msg.trim() === '') {
            return;
        }

        msg = msg.trim();
        chat.chatMessage = null;
        if (socket) {
            var me = $rootScope.sess._id;
            if (chat.isGroupChat) {
                socket.emit('group-message', {room: chat.room, from: me, msg: msg, time: Date.now()});
            }

            var isNewDay = false;
            if (chat.messages.length === 0) {
                isNewDay = true;
            } else if (chat.messages.length > 0) {
                var lastMessageTime = new Date(chat.messages[chat.messages.length - 1].time).setHours(0, 0, 0, 0);
                var todaysDate = new Date(Date.now()).setHours(0, 0, 0, 0);

                if (lastMessageTime === todaysDate) {
                    isNewDay = false;
                } else if (lastMessageTime !== todaysDate) {
                    isNewDay = true;
                }
            }

            if ( chat.messages.length === 0) {
                chat.messages.push({in: false, isFirstMsg: true, isNewDay: isNewDay, from: me, time: Date.now(), msg: msg});
                chat.offset++;
                $rootScope.$broadcast('check-and-scroll-to-bottom-' + chat.room);
            } else if (chat.messages.length > 0) {
                chat.messages.push({in: false, isFirstMsg: false, isNewDay: isNewDay, from: me, time: Date.now(), msg: msg});
                chat.offset++;
                $rootScope.$broadcast('check-and-scroll-to-bottom-' + chat.room);
            }
        }
    };

    $scope.$on('open-group-chat', function(event, _chat) {
        $scope.ctrl.show = true;
        NotificationService.groupChatModalIsOpen.isOpen = $scope.ctrl.show;
        NotificationService.groupChatModalIsOpen.roomNumber = _chat.room;
        $scope.openChat(_chat.users, _chat.room);
        $scope.friends = _chat.users;
        $scope.moreGroupChatUsers = $scope.friends.length - 6;
    });

    $scope.openChat = function(users, room) {
        var chat = null;
        if (!room && angular.isObject(users)) {
            chat = $scope.createRoom(users);
        } else if (room && angular.isArray(users)) {
            chat = $scope.createRoom(users, room);
        }

        if (chat) {

            // join the group chat room on server(socket.io)
            socket.emit('join-room', {
                room: chat.room
            });

            socket.emit('open-chat', {
                id: chat.me._id,
                room: chat.room,
                isGroupChat: true
            });
        }
    };

    /*
    $scope.$on('presence', function(event, presenceData) {
        if ($scope.chats) {
            for(var i = 0; i < $scope.chats.length; i++){
                if($scope.chats[i].friends._id == presenceData.user_id) {
                    $scope.$apply(function () {
                         $scope.chats[i].friends.is_online = presenceData.status;
                    });
                }
            }
        }
    });
    */

    $scope.createRoom = function(friends, room) {
        var isGroupChat = false;
        if (room) {
            isGroupChat = true;
        } else {
            room = $scope.generateRoomName($rootScope.sess._id, friends._id);
        }

        if (!$scope.getChat('room', room)) {

            // guarantees only one chat will show on screen because
            // the chat modal is set up on ng-repeat from previous developer
            $scope.chats = [];

            var chat = {
                isGroupChat: isGroupChat,
                me: $rootScope.sess,
                friends: friends,
                room: room,
                limit: 20,
                offset: 0,
                messages: []
            };

            $scope.chats.push(chat);
            return chat;
        }

        return null;
    };

    $scope.generateRoomName = function(me, friend) {
        return me < friend ? me + '___' + friend : friend + '___' + me;
    };

    $scope.loadChatHistory = function(chat) {
        var deferred = $q.defer();
        var id = chat.me._id;
        var url = '/chat/history/' + chat.room;
        url += '?limit=' + chat.limit + '&offset=' + chat.offset + '&id=' + $rootScope.sess._id;
        $http.get(url).then(function(response) {
            var messages = response.data.map(function(item) {
                var isImage = false;
                if (item.message_type === 'image') {
                    isImage = true;
                }
                var chatMsg = {from: item.from, isImage: isImage, time: item.time, msg: item.message ? item.message : ''};
                chatMsg.in = item.from !== id;

                return chatMsg;
            });


            for (var i = 0; i < messages.length; i++) {
                messages[messages.length - 1].isFirstMessage = true;
                chat.messages.unshift(messages[i]);
            }

            for (var i = 0; i < messages.length -1; i++) {
                messages[i].isFirstMessage = false;
            }

            for (var j = messages.length - 1; j >= 0 ; j--) {
                for (var k = j - 1; k >= 0; k--) {
                    if ( new Date(messages[j].time).setHours(0,0,0,0) === new Date(messages[k].time).setHours(0,0,0,0)) {
                        messages[k].isNewDay = false;
                    } else {
                        messages[k].isNewDay = true;
                    }
                }
            }

            chat.offset += messages.length;
            deferred.resolve(chat);
        }, function(response) {
            deferred.reject();
        });
        return deferred.promise;
    };

    $scope.loadMore = function(room) {
        var chat = $scope.getChat('room', room);
        if (chat) {
            $scope.loadChatHistory(chat);
        }
    };

    $scope.scrollToBottom = function(room) {
        $rootScope.$broadcast('scroll-to-bottom-' + room);
    };


    $scope.closeChat = function(chat) {
        var index = $scope.chats.indexOf(chat);
        if (index > -1) {

            // leave the chat room socket on server
            socket.emit('leave-room', {
                room: chat.room
            });

            socket.emit('close-chat', {id: chat.me._id, room: chat.room});
            $scope.chats.splice(index, 1);
        }
        $scope.ctrl.show = false;
        NotificationService.groupChatModalIsOpen.isOpen = $scope.ctrl.show;
        NotificationService.groupChatModalIsOpen.roomNumber = '';
    };

    $scope.getFromImage = function(from, chat) {
        for (var i = 0; i < chat.friends.length; i++) {
            if (chat.friends[i].user_id === from) {
                return UserService.getProfilePic(chat.friends[i].profile_pic);
            }
        }
        return '';
    };

    $scope.$on('location-updated', function() {
        $scope.init();
    });

    // when the page is refreshed
    $scope.$on('refresh', function (event, args) {

        // if there is an open Group Chat
        if(args.chat.length > 0) {

            //leave room(socket) on the server
            socket.emit('leave-room', {
                room: args.chat[0].room
            });

            // sent the last logout info to the server
            socket.emit('close-chat', {
                id: args.chat[0].me._id,
                room: args.chat[0].room
            });
        }
    });

    $scope.init();
}]);