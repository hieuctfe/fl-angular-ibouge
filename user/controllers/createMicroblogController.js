'use strict';

ibouge.controller('CreateMicroblogController', ['$rootScope', '$scope', 'SocketFactory', '$uibModal', '$uibModalInstance', 'UserService', function ($rootScope, $scope, SocketFactory, $uibModal, $uibModalInstance, UserService){

    var socket = SocketFactory.connection;

    socket.on('new-notification-to-show', function(event) {
        $scope.notifications.hasNewMessage = true;
        $scope.$apply();
    });

    $scope.ctrl = {
        creatorOfMicroblog: null,
        microblogName: null
    };

    $scope.microblog = {
        name: null,
        img: 'img/upload-photo.png',
        users: null
    };

    $scope.clearData = function() {
        $scope.ctrl.creatorOfMicroblog = null;
        $scope.microblogs = [];
    };

    $scope.closeWindow = function () {
        $uibModalInstance.dismiss();
    };

    $scope.createMicroblog = function() {
        var users = [];
        if ($scope.ctrl.creatorOfMicroblog) {
            users.push($scope.ctrl.creatorOfMicroblog);
        }

        var microblog = {
            name: $scope.ctrl.microblogName,
            users: users
        };

        // $scope.microblog.name = microblog.name;
        $scope.microblog.users = microblog.users;

        $scope.clearData();
        $scope.closeWindow();
        $rootScope.$broadcast('create-microblog', microblog);
    };

}]);