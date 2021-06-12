(function () {
    'use strict';

    ibouge.service('DashboardMapService', ['$rootScope', 'UserService', 'EventService', 'AddEventsService', 'AddUsersToMapService', '$timeout', function ($rootScope, UserService, EventService, AddEventsService, AddUsersToMapService, $timeout) {

        // var to hold dashboard map
        var map;

        // var to hold current circle
        var myCircle;

        // var to hold mapAfterMoveEnd function
        // so it can be used in another function that does
        // not have access to some of the vars it needs to
        var mapAfterMoveEndCopy;

        var eventsOnMap;

        // if the client go to another page on website
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {

            // if they are leaving the mydashboard page
            if(fromState.name === 'mydashboard') {

                // clear the circle variable
                myCircle = undefined;
            }
        });

        // function to load map in top right corner of dashboard
        this.loadMap = function (element) {

            console.log("loadMap");

            return new Promise(function (resolve, reject) {

                // get all of the users info
                UserService.getUser($rootScope.sess._id).then(function (data) {

                    // this is the last city the user chose to follow in the
                    // top right corner follow a city map
                    var lastCityFollowedName = data.data.location.lastCityFollowed;
                    var lastCityFollowed = {};

                    console.log(lastCityFollowedName);

                    // for every property in the data.data.location object
                    for(var property in data.data.location) {

                        // if the property exists and has it's own property named 'cityName'
                        if(data.data.location[property] !== null && data.data.location[property].hasOwnProperty('cityName') && property !== "cityToFollow") {

                            // if the current cityName equals the last city followed
                            if(data.data.location[property].cityName === lastCityFollowedName) {

                                // make lastCityFollowed var the property name of the current property
                                lastCityFollowed = data.data.location[property];
                                console.log(lastCityFollowed);
                            }
                        }
                    }

                    // create vars so a bbox can be created
                    var sw = new mapboxgl.LngLat(lastCityFollowed.bbox.sw.lng, lastCityFollowed.bbox.sw.lat);
                    var ne = new mapboxgl.LngLat(lastCityFollowed.bbox.ne.lng, lastCityFollowed.bbox.ne.lat);


                    // get the bounding box of the users current orange circle coordinates
                    var bbox = new mapboxgl.LngLatBounds(sw, ne);

                    // create a new mapboxgl map
                    map = new mapboxgl.Map({
                        container: element,
                        style: 'https://api.maptiler.com/maps/positron/style.json?key=RGierAHokphISswP6JTB'
                    });

                    // adds navigation control for zooming
                    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

                    // fit the map to the users orange circle bounds
                    map.fitBounds(bbox, {
                        linear: true
                    });

                    // get all of the users events
                    EventService.getAllEvents().then(function (events) {

                        // get all users
                        UserService.getAllUsers().then(function (users) {

                            console.log("getAllUsers");
                            console.log(events);
                            console.log(users);

                            // if data has changed try loading new sources
                            var loadNewSource = function () {

                                console.log("data - loaded");

                                // if the new style or data is loaded
                                if (map.isStyleLoaded()) {

                                    console.log("isStyleLoaded");

                                    // add the users events to the map
                                    AddEventsService.addEventIconSource(map, events);

                                    // add users to myDashboard map
                                    AddUsersToMapService.addUsersToMap(map, users);

                                    // user's icon in myDashboard map not visible, not needed
                                    map.setPaintProperty('user_icon', 'circle-opacity', 0);

                                    // turn of data change listener
                                    map.off('data', loadNewSource);
                                }
                            };

                            // When data is changed or finished loading call loadSource()
                            // this refers to when the new style is done loading
                            // the style which gets loaded when the chosen city is clicked
                            map.on('data', loadNewSource);

                            // when the map is done loading
                            map.once('load', function () {

                                console.log("loaded!");

                                var eventsOnMap;
                                var usersOnMap;

                                // this timeout is set to allow mapboxgl the time that is necessary
                                // so that all of the event_icon layers have been added to the map
                                // and can be seen when the queryRenderedFeatures('event_icon') happens
                                // in the AddEventsService.queryRenderedEventsOnMap() function
                                $timeout(function () {

                                    // get all of the events that are on the current map area
                                    eventsOnMap = AddEventsService.queryRenderedEventsOnMap(map, events);

                                    // get all of the users that are on the current map area
                                    usersOnMap = AddUsersToMapService.mapMoveEventChangeIcons(map, users);

                                    // both arrays above are being put in an object to be able to resolve it to the dashboard
                                    var usersAndEvents = {
                                        users: usersOnMap,
                                        events: eventsOnMap
                                    };

                                    console.log(usersAndEvents);

                                    // promise successful, send data back to function call
                                    resolve(usersAndEvents);

                                }, 3000);
                            });
                        });
                    });

                    // function for the map.on('moveend') callback
                    function mapAfterMoveEnd() {
                        // get the center of the map
                        var centerOfMap = map.getCenter();

                        // if there is no orange circle then create one
                        if(myCircle === undefined) {

                            // create a circle to place on the map so the user can
                            // follow the area they'd like to
                            myCircle = new MapboxCircle(centerOfMap, 15000, {
                                editable: false,
                                minRadius: 1500,
                                strokeColor: '#FAC82D',
                                strokeWeight: 2,
                                fillColor: '#FAC82D',
                                fillOpacity: 0.25
                            }).addTo(map, 'place_city');
                        }
                    }

                    // after the map stops moving
                    map.once('moveend', mapAfterMoveEnd);
                });

            });
        };

        // called after a location is changed
        // also called when the user picks a new city
        // to start following from the top right dropdown
        // with the city names in it
        this.reloadMap = function (cityToGoTo, scope) {

            console.log("reloadMap");

            // get all the users current info
            UserService.getUser($rootScope.sess._id).then(function (data) {

                // remove the orange circle on map
                myCircle.remove();

                // if the user has chosen a city already in the database and not a new city
                if(cityToGoTo !== 'extraCityToFollow0' && cityToGoTo !== 'extraCityToFollow1' && cityToGoTo !== 'extraCityToFollow2') {

                    // update the user's lastCityFollowed
                    UserService.updateUser($rootScope.current_user, {

                        location: {
                            lastCityFollowed: cityToGoTo
                        }

                    }).then(function () {

                        // search through the users saved cities and find the appropriate
                        // object in the users database
                        for (var property in data.data.location) {

                            // iterate through all of the saved city objects
                            if(data.data.location[property] !== null && data.data.location[property].hasOwnProperty('cityName') && property !== "cityToFollow") {

                                // if the current city object's cityName is the same as the city the user just selected
                                if(data.data.location[property].cityName === cityToGoTo) {

                                    // create sw and ne coordinate vars to be used in creating a bbox
                                    var sw = new mapboxgl.LngLat(data.data.location[property].bbox.sw.lng, data.data.location[property].bbox.sw.lat);
                                    var ne = new mapboxgl.LngLat(data.data.location[property].bbox.ne.lng, data.data.location[property].bbox.ne.lat);

                                    // get the bounding box of the users current orange circle coordinates
                                    var bbox = new mapboxgl.LngLatBounds(sw, ne);

                                    // send the map to the cities new bbox area
                                    map.fitBounds(bbox, {
                                        linear: false
                                    });
                                }
                            }
                        }

                        // reload the users data so the
                        // appropriate city name will appear
                        scope.loadUserData();

                    }, function () {

                        console.log('User did not update');
                    });

                } else {

                    // create sw and ne coordinate vars to be used in creating a bbox
                    var sw = new mapboxgl.LngLat(data.data.location[cityToGoTo].bbox.sw.lng, data.data.location[cityToGoTo].bbox.sw.lat);
                    var ne = new mapboxgl.LngLat(data.data.location[cityToGoTo].bbox.ne.lng, data.data.location[cityToGoTo].bbox.ne.lat);

                    // create a bbox out of above variables
                    var bbox = new mapboxgl.LngLatBounds(sw, ne);

                    // send the users map to above bbox
                    map.fitBounds(bbox, {
                        linear: false
                    });
                }

                // once the map is finished moving
                map.once('moveend', function () {

                    // get the center of the map
                    var mapCenter = map.getCenter();

                    // set the orange circles center
                    myCircle.setCenter(mapCenter);

                    // add the circle back to the map
                    myCircle.addTo(map, 'place_city');

                    // get all of the users events
                    EventService.getAllEvents().then(function (events) {

                        // get all users
                        UserService.getAllUsers().then(function (users) {

                            // get the events that are on the current map area
                            var eventsOnMap = AddEventsService.queryRenderedEventsOnMap(map, events);

                            // get all of the users that are on the current map area
                            var usersOnMap = AddUsersToMapService.mapMoveEventChangeIcons(map, users);

                            // update the events on the users dashboard
                            scope.loadMyEvents(eventsOnMap);

                            // update the statuses according to the map area
                            scope.showOnlyUsersInMapUpdates(usersOnMap);

                            // users on current map area are copied to this variable in the dashboard for further use
                            // there. This is important to keep for when user switches between "friend's" and "map's"
                            // statuses
                            scope.usersInMap = usersOnMap;
                        });
                    });
                });
            });
        };
    }]);
})();
