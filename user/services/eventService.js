'use strict';

ibouge.service('EventService', ['$rootScope', '$http', '$q', '$timeout', function($rootScope, $http, $q, $timeout) {

    // fetch all events from all users from the database
    this.getAllEvents = function () {

        var deferred = $q.defer();

        // get all events from database
        // if successful send data back to function call
        $http.get('/event/allEvents').then(function (response) {
            deferred.resolve(response.data);

               // else reject and send error
            }, function (response) {
            deferred.reject(response.data);
        });

        // successful, send data back
        return deferred.promise;
    };

    // all events created by session user will be fetched from database
    this.getMyEvents = function(){

        var deferred = $q.defer();

        $http.get('/event/' + $rootScope.sess._id).then(function(response) {

            deferred.resolve(response.data);

        }, function(response) {

            deferred.reject(response.data);

        });

        return deferred.promise;
    };

    // event clicked in dashboard will be fetched to be displayed in event page
    this.getEventClicked = function(data){

         var deferred = $q.defer();

        $http.get('/event/event-clicked/' + data).then(function(response) {

            deferred.resolve(response.data);

        }, function(response) {

            deferred.reject(response.data);

        });

        return deferred.promise;
    };

    // this service creates a new event
    this.createEvent = function(file, data) {

        var deferred = $q.defer();

        $timeout(function() {

            if (data) {
                var albumName = 'events-image';

                // here we create a new formData since we are sending a file through an http request
                var fd = new FormData();

                // we append to the formData the file itself it it exists, the albumName, userId and all of the event properties
                if (file) {
                    fd.append('file', file);
                }
                fd.append('albumName', albumName);
                fd.append('userId', data.createdBy);
                fd.append('address1', data.address1);
                fd.append('address2', data.address2);
                fd.append('category', data.category);
                fd.append('city', data.city);
                fd.append('coordinates0', data.coordinates[0]);
                fd.append('coordinates1', data.coordinates[1]);
                fd.append('country', data.country);
                fd.append('createdBy', data.createdBy);
                fd.append('date', data.date);
                fd.append('endTimeOfEvent',data.endTimeOfEvent);
                fd.append('eventDescription', data.eventDescription);
                fd.append('userGoing', data.going.userGoing);
                fd.append('confirmationDate', data.going.confirmationDate);
                fd.append('name', data.name);
                fd.append('startTimeOfEvent', data.startTimeOfEvent);
                fd.append('state', data.state);
                fd.append('zip', data.zip);

                $http.post('/event/create/', fd, {
                    transformRequest: angular.identity,
                    headers: { 'Content-Type': undefined }
                }).then(function(response) {

                    deferred.resolve(response.data);

                }, function(response) {

                    deferred.resolve(response.data);

                });
            } else {

                deferred.reject('Invalid data');
            }
        });

        return deferred.promise;
    };

    return this;
}]);
