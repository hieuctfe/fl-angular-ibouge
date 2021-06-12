(function () {
    'use strict';

    ibouge.service('AddMicroblogsService', ['$rootScope', 'MicroblogService', '$uibModal', function ($rootScope, MicroblogService, $uibModal) {

        var uniqueMicroblogs;
        var currentMicroblogsOnMap = [];

        this.addMicroblogIconSource = function (map, microblogs) {

            // array to hold Microblog GeoJSON info
            var arrayOfGeoJSON = [];

            // Iterate through all Microblogs and create new GeoJSON
            // based off the lng / lat coordinates
            for(var position in microblogs) {
                var coordinates = microblogs[position].coordinates;

                var dateOfMicroblog = new Date(microblogs[position].created_date).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});


                // geometry for where the microblogging pink dot goes in the map
                var geometry = {
                    "type": "Feature",
                    "properties": {
                        "description": '<div class="events-wrap-view" style="display: flex; padding: 0; border: none;">\
                                    <div>\
                                    <img src="' + microblogs[position].microblog_img + '" class="img-of-creator" />\
                                    </div>\
                                    <div style="margin-top: 5px;">\
                                    <div class="name-of-microblog">\
                                    <span>' + microblogs[position].name + '</span>\
                            </div>\
                            <div class="amount-of-users">\
                                <a href="" class="microblog-box-users microblog-users" style="float: none"><i class="fa fa-user" aria-hidden="true"></i><span>' + microblogs[position].users.length + '</span></a>\
                            <span style="float: left">'+ dateOfMicroblog +'</span>\
                            </div>\
                            </div>\
                            </div>',
                        "room": microblogs[position].room
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": coordinates
                    }
                };

                // push the new geometry onto array holding
                // GeoJSON for microblogs
                arrayOfGeoJSON.push(geometry);
            }

            // Add new source containing GeoJSON info for microblogs
            map.addSource('microblogIcons', {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": arrayOfGeoJSON
                }
            });

            // Add styling for GeoJSON microblog icons
            map.addLayer({
                "id": "microblog_icon",
                "source": "microblogIcons",
                "type": "circle",
                "paint": {
                    "circle-radius": 6,
                    "circle-color": "#FD7088",
                    "circle-opacity": 0
                }
            });
        };

        // Because features come from tiled vector data, feature geometries may be split
        // or duplicated across tile boundaries and, as a result, features may appear
        // multiple times in query results. This fixes that and filters out only unique
        // microblogs
        function getUniqueMicroblogs(microblogs) {

            var existingFeatureKeys = {};

            var uniqueFeatures = microblogs.filter(function (el) {
                if (existingFeatureKeys[el.properties.room]) {
                    return false;
                } else {
                    existingFeatureKeys[el.properties.room] = true;
                    return true;
                }
            });

            return uniqueFeatures;
        }

        // map has been moved, check and change current icons
        // in the right side list
        this.mapMoveEventChangeIcons = function (map, microblogs) {

            // Get only the microblog icons currently on the map
            var microblogsOnMap = map.queryRenderedFeatures({
                layers: ['microblog_icon']
            });

            // if there are microblogs on the map
            if(microblogsOnMap) {

                // sometimes features on the map are doubled
                // this makes sure only 1 icon per feature
                // placed on the map
                uniqueMicroblogs = getUniqueMicroblogs(microblogsOnMap);

                // var to hold final microblogs
                var finalMicroblogs = [];

                // iterate through unique microblogs and place the data
                // from the actual microblog into finalMicroblogs variable
                for (var i = 0; i < uniqueMicroblogs.length; i++) {
                    for (var j = 0; j < microblogs.length; j++) {
                        if (uniqueMicroblogs[i].properties.room === microblogs[j].room) {
                            finalMicroblogs.push(microblogs[j]);
                            break;
                        }
                    }
                }

                currentMicroblogsOnMap = finalMicroblogs;

                // $broadcast to mapController.js the final microblogs
                // to be placed in the right hand side list of microblogs
                $rootScope.$broadcast('currentMicroblogs', {
                    currentMicroblogs: currentMicroblogsOnMap
                });
            }
        };

    }]);

})();