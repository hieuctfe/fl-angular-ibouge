(function () {
    'use strict';

    ibouge.factory('SocketFactory', ['$rootScope', function ($rootScope) {

        // socket object
        var socket = {};

        // function which makes the clients socket
        // connect to the server
        var socketConnection = function () {
            var ioHost = 'https://www.ibouge.com';
            if (document.location.hostname == 'localhost' || document.location.hostname == '127.0.0.1') {
                ioHost = 'http://' + document.location.hostname + ':8080';
            }
            return io.connect(ioHost);
        };

        // call the function which connects clients
        // socket with the server and add it to the
        // "socket" object as a property so it can be
        // used throughout the app
        socket.connection = socketConnection();

        // whenever a socket is connected to the server
        socket.connection.on('connect', function () {

            var interval = setInterval(function() {
                if ($rootScope.sess && angular.isObject($rootScope.sess)) {

                    socket.connection.emit('addUserID', {
                        id: $rootScope.sess._id
                    });

                    clearInterval(interval); 
                }
            }, 3000);

            socket.connection.on('newNotification', function(data) {
                if(!data) {

                    $rootScope.$broadcast('new-notification');

                } else {

                    $rootScope.$broadcast('new-notification', { type: data.type });

                }
            });

            socket.connection.on('presence', function(data) {
                $rootScope.$broadcast('presence', data);
            });
        });

        // returns the socket object anytime
        // the SocketFactory is called in the app
        return socket;

    }]);

})();