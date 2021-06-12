'use strict';

ibouge.service('NotificationService', ['$state', '$rootScope', '$q', '$timeout', '$http', 'ChatService', 'MicroblogService','SocketFactory', function($state, $rootScope, $q, $timeout, $http, ChatService, MicroblogService, SocketFactory) {

	this.openGroupChat = function(notification) {
		var room = null;
		if(notification.is_group_chat == true) {
			room = notification.room;
		} else {
            room = notification.meta.filter(function(item) {
                return item.key == 'room';
            }).map(function(item) {
                return item.value;
            });

            room = room && room.length > 0 ? room[0] : null;
		}
		
		ChatService.getChat(room).then(function(chat) {
			if (chat.is_group_chat) {
				$rootScope.$broadcast('open-group-chat', chat);
			}
		}, function(err) {

		})
	};

    this.openMicroblog = function(notification) {
        var room = null;
        var creator = notification.meta.filter(function(item) {
        	return item.key == 'created_by';
		}).map(function(item) {
			return item.value;
		});

        if(notification.is_microblog == true) {
            room = notification.room;
        } else {
            room = notification.meta.filter(function(item) {
                return item.key == 'room';
            }).map(function(item) {
                return item.value;
            });

            room = room && room.length > 0 ? room[0] : null;
        }

        MicroblogService.getMicroblog(room).then(function(microblog) {
            if (microblog.is_microblog) {
                $rootScope.$broadcast('open-microblog-modal', microblog);
            }
        }, function(err) {

        })
    };

    this.openMicroblogForInvitee = function(notification) {
        var room = null;
        var creator = notification.meta.filter(function(item) {
            return item.key == 'created_by';
        }).map(function(item) {
            return item.value;
        });

        if(notification.is_microblog == true) {
            room = notification.room;
        } else {
            room = notification.meta.filter(function(item) {
                return item.key == 'room';
            }).map(function(item) {
                return item.value;
            });

            room = room && room.length > 0 ? room[0] : null;
        }

        MicroblogService.getMicroblogForInvitee(room, creator).then(function(microblog) {

        }, function(err) {

        })
    };

	this.newNotification = function (friendID, typeOfChange) {

        // get the socket connection to the server
        var socket = SocketFactory.connection;

		if (typeOfChange == '') {
            socket.emit('new-notification', { from: $rootScope.sess._id, to: friendID });
		} else {
			socket.emit('new-notification', { from: $rootScope.sess._id, to: friendID, type: typeOfChange });
		}

    };

	// for the notifications in maincontroller.js to know whether
	// group Chat modal is open
	this.groupChatModalIsOpen = {
		isOpen: false,
		roomNumber: String
	};

	return this;

}]);