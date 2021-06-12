'use strict';

ibouge.controller('EventController', ['$scope', '$rootScope', '$stateParams', 'EventService', 'SocketFactory', 'UserService', function($scope, $rootScope, $stateParams, EventService, SocketFactory, UserService) {

    var socket = SocketFactory.connection;

    socket.on('new-notification-to-show', function(event) {
        $scope.notifications.hasNewMessage = true;
        $scope.$apply();
    });

    // initializing variables
	$scope.event = {};
    var id = $stateParams.eventId;
    $scope.goingStatus = false;
    $scope.friends = [];


    // get the socket connection to the server
    var socket = SocketFactory.connection;

	$scope.init = function() {

        $scope.getEventClicked(id);

        $scope.loadMyFriends();
	};

	// the event clicked is the event chosen in the dashboard, this function gets it from the database given its ID
	$scope.getEventClicked = function(ID) {

        EventService.getEventClicked(ID).then(function(event) {

            $scope.event = event;

            // this checks weather session user is going to event or not, if so, the "GOING" button will be orange and viceversa.
            var allGoing = $scope.event.going;

            for (var i = 0; i < allGoing.length; i++){

                if ($rootScope.sess._id === allGoing[i].userId){

                    $scope.goingStatus = true;

                }

            }

            // get the element to add the map to
            var mapElement = document.getElementById('chartEventMap');

            // create the map
            var map = new mapboxgl.Map({
                container: mapElement,
                style: 'https://api.maptiler.com/maps/positron/style.json?key=RGierAHokphISswP6JTB',
                zoom: 15,
                center: event.location.coordinates
            });

            // add navigation control to the map
            map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

            // when the map is finished loading
            map.on('load', function () {

                // GeoJSON source for purple dot which is for event
                map.addSource('single-point', {
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": []
                    }
                });

                // add the layer for the purple dot for event
                map.addLayer({
                    "id": "point",
                    "source": "single-point",
                    "type": "circle",
                    "paint": {
                        "circle-radius": 10,
                        "circle-color": '#B400E1'
                    }
                });

                // geometry for where the event purple dot goes in the map
                var geometry = {
                    "type": "Feature",
                    "properties": {
                        "description": event.location.address1
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": event.location.coordinates
                    }
                };

                // get the purple dot and place it on the map
                map.getSource('single-point').setData(geometry);

                // create a new popup for when the user hovers over purple event icon
                var popup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false
                });

                // when the mouse enters the popup
                map.on('mouseenter', 'point', function(e) {

                    // Change the cursor style as a UI indicator.
                    map.getCanvas().style.cursor = 'pointer';

                    // get the description of the event
                    var description = e.features[0].properties.description;

                    // Populate the popup and set its coordinates
                    // based on the feature found.
                    popup.setLngLat(event.location.coordinates)
                        .setHTML(description)
                        .addTo(map);
                });

                // when the mouse leaves the popup
                map.on('mouseleave', 'point', function() {

                    // return cursor to normal and remove
                    // the popup from the screen
                    map.getCanvas().style.cursor = '';
                    popup.remove();
                });
            });
        }, function(err){

            console.log('err loading event: ', err);

        });
	};

	// this function is prompted when user clicks "GOING" on event page
	$scope.goingToEvent = function(eventId){

        $scope.goingStatus = true;

        var data = {
            eventID: eventId,
            user: $rootScope.sess._id
        };

        // this socket sends data to database
        socket.emit('going-to-event', data);
    };

    // this function is prompted if user clicks "not going" button on event page.
	$scope.notGoingToEvent = function(eventId){

        $scope.goingStatus = false;

        var data = {
            eventID: eventId,
            user: $rootScope.sess._id
        };

        // this socket sends user info to be removed from "going" array
        socket.emit('not-going-to-event', data);
    };

    $scope.loadMyFriends = function() {
        UserService.getMyFriends().then(function(friends) {
            $scope.friends = $scope.friends.concat(friends);
            var myFriendsLength = $scope.friends.length;
            $scope.event.interested = [];

            for (var i = 0; i < myFriendsLength; i++) {
                $scope.event.likes.find(function (likedBy){
                    if ($scope.friends[i]._id === likedBy.user) {
                        $scope.event.interested.push({user: $scope.friends[i]._id, img: $scope.friends[i].profile_pic});
                    }
                })
            }
        }, function(err) {
            if (err) {
                console.log('friends load err :', err);
            }
        });
    };

	$scope.init();
}]);
