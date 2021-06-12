(function () {
    'use strict';

    ibouge.service('AddEventsService', ['$rootScope',  function ($rootScope) {

        var uniqueEvents;
        var currentEventsOnMap = [];

        this.addEventIconSource = function (map, events) {

            // array to hold Event GeoJSON info
            var arrayOfGeoJSON = [];

            // hold the eventsImage URL
            var eventImage = '';

            // Iterate through all events and create new GeoJSON
            // based off the lng / lat coordinates
            for(var position in events) {
                var coordinates = events[position].location.coordinates;

                // get the actual date and time of the event
                var dateOfEvent = new Date(events[position].dateOfEvent).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});
                var timeOfEvent = new Date(events[position].eventStartTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // if the user did not add an event image
                if(events[position].eventImage === undefined) {

                    // use a generic image
                    events[position].eventImage = 'img/noImageAvailable.jpg'

                }

                // geometry for where the events purple dot goes in the map
                var geometry = {
                    "type": "Feature",
                    "properties": {
                        "description": '<div class="events-wrap-view" style="display: flex; padding: 0; border: none;">\
                                    <div>\
                                    <img src="' + events[position].eventImage + '" class="img-of-creator" />\
                                    </div>\
                                    <div style="margin-top: 5px;">\
                                    <div class="name-of-microblog">\
                                    <span>' + events[position].name + '</span>\
                            </div>\
                            <div class="amount-of-users">\
                                <a href="" class="microblog-box-users microblog-users" style="float: none"><i class="fa fa-user" aria-hidden="true"></i><span>' + events[position].going.length + '</span></a>\
                            <span style="float: left">'+ dateOfEvent + ' @ ' + timeOfEvent + '</span>\
                            </div>\
                            </div>\
                            </div>',
                        id: events[position]._id
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": coordinates
                    }
                };

                // push the new geometry onto array holding
                // GeoJSON for events
                arrayOfGeoJSON.push(geometry);
            }

            // Add new source containing GeoJSON info for events
            map.addSource('eventIcons', {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": arrayOfGeoJSON
                }
            });

            // Add styling for GeoJSON event icons
            map.addLayer({
                "id": "event_icon",
                "source": "eventIcons",
                "type": "circle",
                "paint": {
                    "circle-radius": 6,
                    "circle-color": "#B400E1",
                    "circle-opacity": 0
                }
            });
        };

        // Because features come from tiled vector data, feature geometries may be split
        // or duplicated across tile boundaries and, as a result, features may appear
        // multiple times in query results. This fixes that and filters out only unique
        // events
        function getUniqueEvents(events) {

            var existingFeatureKeys = {};

            var uniqueFeatures = events.filter(function (el) {
                if (existingFeatureKeys[el.properties.id]) {
                    return false;
                } else {
                    existingFeatureKeys[el.properties.id] = true;
                    return true;
                }
            });

            return uniqueFeatures;
        }

        // map has been moved, check and change current icons
        // in the right side list
        this.mapMoveEventChangeIcons = function (map, events) {

            // Get only the event icons currently on the map
            var eventsOnMap = map.queryRenderedFeatures({
                layers: ['event_icon']
            });

            // if there are events on the map
            if(eventsOnMap) {

                // sometimes features on the map are doubled
                // this makes sure only 1 icon per feature
                // placed on the map
                uniqueEvents = getUniqueEvents(eventsOnMap);

                // var to hold final events
                var finalEvents = [];

                // iterate through unique events and place the data
                // from the actual event into finalEvents variable
                for (var i = 0; i < uniqueEvents.length; i++) {
                    for (var j = 0; j < events.length; j++) {
                        if (uniqueEvents[i].properties.id === events[j]._id) {
                            finalEvents.push(events[j]);
                            break;
                        }
                    }
                }

                currentEventsOnMap = finalEvents;

                // $broadcast to mapController.js the final events
                // to be placed in the right hand side list of events
                $rootScope.$broadcast('currentEvents', {
                    currentEvents: currentEventsOnMap
                });
            }
        };

        // function is used to query the event features which are on the map
        this.queryRenderedEventsOnMap = function (map, events) {

            // will hold all of the events
            var eventsOnMap;

            // if the layer 'event_icon' is on the map
            if(map.getLayer('event_icon')) {

                // Get only the event icons currently on the map
                eventsOnMap = map.queryRenderedFeatures({
                    layers: ['event_icon']
                });

            }

            // if there are events on the map
            if(eventsOnMap) {

                // sometimes features on the map are doubled
                // this makes sure only 1 icon per feature
                // placed on the map
                uniqueEvents = getUniqueEvents(eventsOnMap);

                // var to hold final events
                var finalEvents = [];

                // iterate through unique events and place the data
                // from the actual event into finalEvents variable
                for (var i = 0; i < uniqueEvents.length; i++) {
                    for (var j = 0; j < events.length; j++) {
                        if (uniqueEvents[i].properties.id === events[j]._id) {
                            finalEvents.push(events[j]);
                            break;
                        }
                    }
                }

                // return only the events on the map
                return finalEvents;
            }
        };

    }]);

})();