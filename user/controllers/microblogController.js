'use strict';

ibouge.controller('MicroblogController', ['$scope', '$rootScope', 'microblogToOpen','$compile', '$http', '$q', '$uibModalInstance', 'UserService', '$timeout', 'MicroblogService', 'NotificationService','SocketFactory', 'usSpinnerService', function ($scope, $rootScope, microblogToOpen, $compile, $http, $q, $uibModalInstance, UserService, $timeout, MicroblogService, NotificationService, SocketFactory, usSpinnerService) {

    var socket = SocketFactory.connection;

    socket.on('new-notification-to-show', function(event) {
        $scope.notifications.hasNewMessage = true;
        $scope.$apply();
    });

    $scope.microblogs = [];
    $scope.currentMicroblog = microblogToOpen;
    $scope.microblogUsers = $scope.currentMicroblog.users;
    $scope.microblogUsers = [];
    $scope.moreUsers = $scope.microblogUsers.length - 6;
    $scope.microblogs.push($scope.currentMicroblog);
    $scope.US = UserService;
    $scope.bookmarkClicked = false;
    $scope.isFirstMsg = false;
    $scope.myFriends = {
        show: false,
        friends: []
    };
    $scope.friendsToInvite = [];
    $scope.allInvolved = [];
    var newUserMeta = {};
    $scope.File = {};
    $scope.isFileSelected = false;
    $scope.imageInfo = {};


    // get the socket connection to the server
    var socket = SocketFactory.connection;

    // ⬇️⬇️⬇️ SOCKET.IO LISTENER FUNCTIONS FOR SOCKET.ON CALLBACKS ⬇️⬇️⬇️️ !!!

    function loadMicroblogHistoryFunction (data) {

        var microblog = $scope.getMicroblog('room', data.room);
        if (microblog) {
            $scope.loadMicroblogHistory(microblog).then(function() {
                $scope.scrollToBottomOfMicroblog(microblog.room);
            }, function() {
            });
        }
    }

    function microblogMessage(data) {
        $scope.showMessageInMicroblog(data);
        $rootScope.$broadcast('microblog-message', {typeOfChat: 'isMicroblog',
            microblogRoom: data.room});
    }

    function microblogImageMessage(data) {
        $scope.showImageMessage(data);
    }

    function newMicroblogUser (data) {
        $scope.showNewUserInMicroblog(data);
    }

    //  ⬆️️⬆️️⬆️ SOCKET.IO LISTENER FUNCTIONS FOR SOCKET.ON CALLBACKS ⬆️️⬆️️⬆️

    $scope.init = function() {

        $scope.loadMyFriends();

        $rootScope.$broadcast('open-microblog-modal', microblogToOpen);
    };

    // function to decide which of the clients friends
    // go on the right side of the microblog when the add
    // a friend button is clicked
    $scope.loadMyFriends = function() {
        
        // get all of the users friends
        UserService.getMyFriends().then(function(friends) {
           
            // put those friends into the below empty array
            $scope.myFriends.friends = $scope.myFriends.friends.concat(friends);

            // variables to hold friends for iteration
            var myFriends = [];
            myFriends = myFriends.concat(friends);
            var myFriendsLength = myFriends.length;

            // iterate through each of the clients friends
            for(var i = 0; i < myFriendsLength; i++) {

                // search the microblog users
                $scope.microblogUsers.find(function (microblogUser) {

                    // if the current microblogUsers id matches the
                    // current friends id
                    if(myFriends[i]._id === microblogUser.user_id) {

                        // search through the $scopes friends
                        $scope.myFriends.friends.find(function (friend, index) {

                            // if the microblog user and friends id match
                            if(microblogUser.user_id === friend._id) {

                                // remove that friends from the $scope.myFriends.friends
                                $scope.myFriends.friends.splice(index, 1);
                                return true;
                            }
                        });
                    }
                });
            }

        }, function(err) {
            console.log('friends load err :', err);
        });
    };

    $scope.showMyFriends = function() {
        if ($scope.myFriends.show === false) {
            $scope.myFriends.show = true;
        } else {
            $scope.myFriends.show = false;
        }
    };

    $scope.selectFriend = function(friendId) {
        var secondElement = document.getElementById("friendImg" + friendId);
        if (secondElement.classList.contains('faded')) {
            secondElement.classList.remove('faded');
            for (var j = 0; j < $scope.friendsToInvite.length; j++) {
                if ( $scope.friendsToInvite[j]._id === friendId) {
                    var index = $scope.friendsToInvite.indexOf($scope.friendsToInvite[j]);
                    $scope.friendsToInvite.splice(index, 1);
                }
                if ($scope.friendsToInvite.length === 0) {
                    $scope.friendsToInvite = [];
                }
            }
        } else {
            secondElement.classList.add('faded');
            for (var i = 0; i < $scope.myFriends.friends.length; i++) {
                if ($scope.myFriends.friends[i]._id === friendId){
                    $scope.myFriends.friends[i].selected = true;
                    $scope.friendsToInvite.push($scope.myFriends.friends[i]);
                }
            }
        }
    };

    $scope.inviteFriends = function () {
        var friendsToInvite = [];
        for (var i = 0; i < $scope.friendsToInvite.length; i++) {
            friendsToInvite.push($scope.friendsToInvite[i]._id);
        }

        var data = {
            microblog: microblogToOpen,
            friends: friendsToInvite
        };
        MicroblogService.addMicroblogNotification(data);
        for (var j = 0; j < friendsToInvite.length; j++) {
            NotificationService.newNotification(friendsToInvite[j], 'invite-to-microblog');
        }


        var inviteInfo = {
            room: microblogToOpen.room,
            users: friendsToInvite
        };
        socket.emit('update-all-involved-array', inviteInfo);

        $scope.myFriends.show = false;
    };

    $scope.getMicroblog = function(key, value) {
        for (var i = 0; i < $scope.microblogs.length; i++) {
            if ($scope.microblogs[i][key] === value) {
                return $scope.microblogs[i];
            }
        }
        return null;
    };

    $scope.showMessageInMicroblog = function(data) {

        var microblog = $scope.getMicroblog('room', data.room);
        if (microblog) {
            // microblog exists
            microblog.messages.push({in: true, from: data.from, isFirstMsg: data.isFirstMsg, time: data.time, msg: data.msg});
            microblog.offset++;
            $rootScope.$broadcast('check-and-scroll-to-bottom-' + microblog.room);
            $scope.$apply();
        } else {
            // if (NotificationService.groupChatModalIsOpen.isOpen !== true) {
                // new microblog
                MicroblogService.getMicroblog(data.room).then(function (_microblog) {
                    $scope.openMicroblog(_microblog.users, _microblog.room);
                }, function (err) {
                    console.log('get microblog failed : ', err);
                });
            // }
        }
    };

    $scope.showNewUserInMicroblog = function(data) {

            UserService.getUserMeta(data.user).then(function(meta){
                newUserMeta = meta;
                $scope.microblogUsers.push({user_id: newUserMeta[0]._id, last_login: Date.now(), fname: newUserMeta[0].fname, lname: newUserMeta[0].lname, profile_pic: newUserMeta[0].profile_pic});
            });
    };

    // this function shows me the image message my friend sent asynchronously
    $scope.showImageMessage = function(data){

        var microblog = $scope.getMicroblog('room', data.room);
        if (microblog) {
            var isNewDate = false;
            if (microblog.messages.length === 0) {
                isNewDate = true;
            } else if (microblog.messages.length > 0) {
                var lastMessagesTime = new Date(microblog.messages[microblog.messages.length - 1].time).setHours(0,0,0,0);
                var todaysDate = new Date(Date.now()).setHours(0,0,0,0);

                if (lastMessagesTime === todaysDate){
                    isNewDate = false;
                } else if (lastMessagesTime !== todaysDate){
                    isNewDate = true;
                }
            }


            if ( microblog.messages.length === 0) {
                microblog.messages.push({in: true, isImage: data.isImage, isFirstMsg: true, isNewDate: isNewDate, from: data.from, time: data.time, msg: data.msg, src: data.src, ownMsg: false});
                microblog.offset++;
                $rootScope.$broadcast('check-and-scroll-to-bottom-' + microblog.room);
                $scope.$apply();
            } else if (microblog.messages.length > 0) {
                microblog.messages.push({in: true, isImage: data.isImage, isFirstMsg: false, isNewDate: isNewDate, from: data.from, time: data.time, msg: data.msg, src: data.src, ownMsg: false});
                microblog.offset++;
                $rootScope.$broadcast('check-and-scroll-to-bottom-' + microblog.room);
                $scope.$apply();
            }
        }
    };

    $scope.handleImageFileSelect = function(evt) {
        $scope.File = evt.currentTarget.files[0];
        var microblogRoom = evt.currentTarget.id;
        var albumName = 'microblogs-image-message';
        var msgTime = Date.now();

        var fd = new FormData();
        fd.append('albumName', albumName);
        fd.append('file', $scope.File);
        fd.append('microblogRoom', microblogRoom);
        fd.append('message_type', "image");
        fd.append('message', "");
        fd.append('from', $rootScope.sess._id);

        usSpinnerService.spin('spinner-2');

        $http.post("/microblog/upload-image-message", fd, {
            transformRequest: angular.identity,
            headers: { 'Content-Type': undefined }
        }).then(function (response) {

            usSpinnerService.stop('spinner-2');

            var microblog = $scope.getMicroblog('room', microblogRoom);
            var userExists = false;
            var data = {
                microblogRoom: microblog.room,
                user: microblog.me._id
            };

            for (var i = 0; i < $scope.microblogUsers.length; i++) {
                if ($scope.microblogUsers[i].user_id === data.user) {
                    userExists = true;
                    i = $scope.microblogUsers.length;
                } else {
                    userExists = false;
                }
            }

            if (userExists === false) {

                socket.emit('new-microblog-user', {room: data.microblogRoom, user: data.user});

                UserService.getUserMeta(data.user).then(function(meta){
                    newUserMeta = meta;
                    $scope.microblogUsers.push({user_id: newUserMeta[0]._id, last_login: Date.now(), fname: newUserMeta[0].fname, lname: newUserMeta[0].lname, profile_pic: newUserMeta[0].profile_pic});
                });

                $scope.bookmarkMicroblog(microblog);
            }


            if (socket) {
                var me = $rootScope.sess._id;
                if (microblog.isMicroblog) {
                    var imgMsgData = {
                        isImage: true,
                        from: me,
                        time: response.data.messages[0].time,
                        msg: response.data.messages[0].message,
                        src: response.data.messages[0].message,
                        room: microblog.room
                    };
                    socket.emit('microblog-image-message', microblogRoom, imgMsgData);
                }

                var isNewDate = false;
                if ( microblog.messages.length === 0) {
                    isNewDate = true;
                } else if (microblog.messages.length > 0) {
                    var lastMessagesTime = new Date(microblog.messages[microblog.messages.length - 1].time).setHours(0,0,0,0);
                    var todaysDate = new Date(Date.now()).setHours(0,0,0,0);

                    if (lastMessagesTime === todaysDate){
                        isNewDate = false;
                    } else if (lastMessagesTime !== todaysDate){
                        isNewDate = true;
                    }
                }

                if ( microblog.messages.length === 0) {
                    microblog.messages.push({in: false, isImage: true, isFirstMsg: true, isNewDate: isNewDate, from: me, time: response.data.messages[0].time, msg: response.data.messages[0].message, src: response.data.messages[0].message, ownMsg: true});
                    microblog.offset++;
                    $rootScope.$broadcast('check-and-scroll-to-bottom-' + microblog.room);
                } else if (microblog.messages.length > 0) {
                    microblog.messages.push({in: false, isImage: true, isFirstMsg: false, isNewDate: isNewDate, from: me, time: response.data.messages[0].time, msg: response.data.messages[0].message, src: response.data.messages[0].message, ownMsg: true});
                    microblog.offset++;
                    $rootScope.$broadcast('check-and-scroll-to-bottom-' + microblog.room);
                }
            }
        });

    };


    $scope.sendMicroblogMsgOnEnter = function(event, msg, microblog) {
        if (event.which === 13) {
            $scope.sendMicroblogMsg(msg, microblog);
        }
    };

    $scope.sendMicroblogMsg = function(msg, microblog) {
        var userExists = false;
        var data = {
            microblogRoom: microblog.room,
            user: microblog.me._id
        };

        for (var i = 0; i < $scope.microblogUsers.length; i++) {
            if ($scope.microblogUsers[i].user_id === data.user) {
                userExists = true;
                i = $scope.microblogUsers.length;
            } else {
                userExists = false;
            }
        }

        if (userExists === false) {

            socket.emit('new-microblog-user', {room: data.microblogRoom, user: data.user});

            UserService.getUserMeta(data.user).then(function(meta){
                newUserMeta = meta;
                $scope.microblogUsers.push({user_id: newUserMeta[0]._id, last_login: Date.now(), fname: newUserMeta[0].fname, lname: newUserMeta[0].lname, profile_pic: newUserMeta[0].profile_pic});
            });

            $scope.bookmarkMicroblog(microblog);
        }

        if (!msg || msg.trim() === '') {
            return;
        }

        msg = msg.trim();
        microblog.microblogMessage = null;
        if (socket) {
            var me = $rootScope.sess._id;
            if (microblog.isMicroblog) {
                socket.emit('microblog-message', {room: microblog.room, from: me, msg: msg, time: Date.now()});
            }

            var isNewDate = false;
            if ( microblog.messages.length === 0) {
                isNewDate = true;
            } else if (microblog.messages.length > 0) {
                var lastMessagesTime = new Date(microblog.messages[microblog.messages.length - 1].time).setHours(0,0,0,0);
                var todaysDate = new Date(Date.now()).setHours(0,0,0,0);

                if (lastMessagesTime === todaysDate){
                    isNewDate = false;
                } else if (lastMessagesTime !== todaysDate){
                    isNewDate = true;
                }
            }

            if ( microblog.messages.length === 0) {
                microblog.messages.push({in: false, isFirstMsg: true, isNewDate: isNewDate, from: me, time: Date.now(), msg: msg});
                microblog.offset++;
                $rootScope.$broadcast('check-and-scroll-to-bottom-' + microblog.room);
            } else if (microblog.messages.length > 0) {
                microblog.messages.push({in: false, isFirstMsg: false, isNewDate: isNewDate, from: me, time: Date.now(), msg: msg});
                microblog.offset++;
                $rootScope.$broadcast('check-and-scroll-to-bottom-' + microblog.room);
            }
        }
    };

    $scope.$on('open-microblog-modal', function (event, _microblog) {
        if (_microblog.created_by === $rootScope.sess._id) {
            $scope.bookmarkClicked = true;
        }
        for (var i = 0; i < _microblog.users.length; i++) {
            if ( _microblog.users[i].user_id === $scope.sess._id){
                $scope.bookmarkClicked = true;
            }
        }
        $scope.openMicroblog(_microblog.users, _microblog.room, _microblog.name);
        $scope.microblogUsers = _microblog.users;
    });

    $scope.openMicroblog = function(users, room, name) {
        var microblog = null;
        if (!room && angular.isObject(users)) {
            microblog = $scope.createRoomForMicroblog(users);
        } else if (room && angular.isArray(users)) {
            microblog = $scope.createRoomForMicroblog(users, room, name);
        }

        if (microblog) {

            // turn on socket.io callback listeners
            socket.on('loadMicroblogHistory', loadMicroblogHistoryFunction);
            socket.on('microblogMessage', microblogMessage);
            socket.on('microblog-image-message-to-friends', microblogImageMessage);
            socket.on('new-microblog-user', newMicroblogUser);



            // join the microblog room for messages
            socket.emit('join-room', {
                room: microblog.room
            });

            socket.emit('open-microblog', {id: microblog.me._id, room: microblog.room});
        }
    };

    $scope.createRoomForMicroblog = function(friends, room, name) {
        var isMicroblog = false;
        if (room) {
            isMicroblog = true;
        } else {
            room = $scope.generateRoomNameForMicroblog($rootScope.sess._id, friends._id);
        }

        if ($scope.getMicroblog('room', room)) {
            $scope.microblogs = [];

            var microblog = {
                isMicroblog: isMicroblog,
                name: name,
                me: $rootScope.sess,
                friends: friends,
                room: room,
                limit: 20,
                offset: 0,
                messages: []
            };

            $scope.microblogs.push(microblog);
            return microblog;
        }

        return null;
    };

    $scope.generateRoomNameForMicroblog = function(me, friend) {
        return me < friend ? me + '___' + friend : friend + '____' + me;
    };

    $scope.loadMicroblogHistory = function(microblog) {
        var deferred = $q.defer();
        var id = microblog.me._id;
        var url = '/microblog/history/' + microblog.room;
        url += '?limit=' + microblog.limit + '&offset=' + microblog.offset + '&id=' + $rootScope.sess._id;
        $http.get(url).then(function(response) {
            var messages = response.data.map(function(item) {
                var isImage = false;
                if (item.message_type === 'image') {
                    isImage = true;
                }
                var microblogMsg = {from: item.from, isImage: isImage, time: item.time, msg: item.message ? item.message : ''};
                microblogMsg.in = item.from !== id;

                return microblogMsg;
            });


            for (var i = 0; i < messages.length; i++) {
                messages[messages.length - 1].isFirstMsg = true;
                microblog.messages.unshift(messages[i]);
            }


            for (var i = 0; i < messages.length -1; i++) {
                messages[i].isFirstMsg = false;
            }


            for (var j = messages.length - 1; j >= 0 ; j--) {
                for (var k = j - 1; k >= 0; k--) {
                    if ( new Date(messages[j].time).setHours(0,0,0,0) === new Date(messages[k].time).setHours(0,0,0,0)) {
                        messages[k].isNewDate = false;
                    } else {
                        messages[k].isNewDate = true;
                    }
                }
            }

            microblog.offset += messages.length;
            deferred.resolve(microblog);
        }, function(response) {
            deferred.reject();
        });
        return deferred.promise;
    };

    $scope.loadMore = function(room) {
        var microblog = $scope.getMicroblog('room', room);
        if (microblog) {
            $scope.loadMicroblogHistory(microblog);
        }
    };

    $scope.scrollToBottomOfMicroblog = function(room) {
        $rootScope.$broadcast('scroll-to-bottom-' + room);
    };

    // $scope.closeMicroblog = function(microblog) {
    //     var index = $scope.microblogs.indexOf(microblog);
    //     if (index > -1) {
    //         socket.emit('close-microblog', {id: microblog.me._id, room: microblog.room});
    //         $scope.microblogs.splice(index, 1);
    //     }
    //     // $scope.microBlogCtrl.show = false;
    //     // Notification stuff here
    // };

    $scope.getImageForMicroblog = function(from, microblog) {
        for (var i = 0; i < microblog.friends.length; i++) {
            if (microblog.friends[i].user_id === from) {
                return UserService.getProfilePic(microblog.friends[i].profile_pic);
            }
        }
        return '';
    };

    $scope.$on('location-updated', function() {
        $scope.init();
    });

    $scope.bookmarkMicroblog = function(microblog) {
        $scope.bookmarkClicked = true;
        var reqInfo = {
            user: $rootScope.sess._id,
            room: microblog.room
        };
        UserService.updateUserBookmarkedMicroblogs(reqInfo.user, reqInfo.room).then(function(response){
        }, function(err) {
            console.log('could not add microblog to user profile:', err);
        });
    };
    $scope.unBookmarkMicroblog = function(microblog) {
        $scope.bookmarkClicked = false;
        var reqInfo = {
            user: $rootScope.sess._id,
            room: microblog
        };
        UserService.unbookmarkMicroblog(reqInfo.user, reqInfo.room).then(function(response){
        }, function(err) {
            console.log('could not un-bookmark microblog:', err);
        });
        MicroblogService.removeUserFromMicroblog(reqInfo).then(function(response) {
        }, function (err) {
            console.log('could not remove user from microblog: ', err);
        });
    };

    $scope.bookmarkToggle = function (microblog) {
        if ($scope.bookmarkClicked) {
            $scope.unBookmarkMicroblog(microblog.room)
        } else {
           $scope.bookmarkMicroblog(microblog);
        }
    };

    $scope.closeWindow = function (microblog) {
        var index = $scope.microblogs.indexOf(microblog);
        if (index > -1) {

            // turn off socket.io callback listeners
            socket.off('loadMicroblogHistory', loadMicroblogHistoryFunction);
            socket.off('microblogMessage', microblogMessage);
            socket.off('microblog-image-message-to-friends', microblogImageMessage);
            socket.off('new-microblog-user', newMicroblogUser);


            // leave microblog room for messages
            socket.emit('leave-room', {
                room: microblog.room
            });

            socket.emit('close-microblog', {id: microblog.me._id, room: microblog.room});
        }
        $uibModalInstance.dismiss();
    };

    $scope.init();

}]);