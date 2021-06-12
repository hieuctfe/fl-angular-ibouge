(function () {
    'use strict';

    ibouge.service('CreateEventMapService', ['$rootScope', '$http', function ($rootScope, $http) {

        // address of the location clicked or searched
        var locationName;
        // coordinates of the location clicked or searched
        var coordinates = [];

        // city of the location clicked or searched
        var city;

        // state of the location clicked or searched
        var state;

        mapboxgl.accessToken = 'pk.eyJ1IjoiaWJvdWdlIiwiYSI6ImNqY2wzaXJ5YTAycWIzM2pyb3JhN20yenkifQ.jhimhHWkb-6GD3Tq8bvCKA';

        // function to create the map for the creating a event screen
        this.createMap = function (element, scope) {

            var map = new mapboxgl.Map({
                container: element,
                style: 'https://api.maptiler.com/maps/positron/style.json?key=RGierAHokphISswP6JTB',
                zoom: 0,
                center: [0, 0]
            });

            // create geocoder
            var geocoder = new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                types: 'address'
            });

            // get the element to add the geocoder to
            var geoCoderElement = document.getElementById('createEventGeocoder');

            // if the element has the old geocoder
            if(geoCoderElement.childElementCount > 0) {

                // remove the geocoder's child node
                geoCoderElement.removeChild(geoCoderElement.childNodes[0]);
            }

            // add the geocoder to the #createEventGeocoder div
            geoCoderElement.appendChild(geocoder.onAdd(map));

            // add navigation control to the map
            map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

            // after the map loads do...
            map.on('load', function () {

                // resize the map, this is done because the map is rendered before the modal is
                // this causes the map to load incompletely and look funny
                map.resize();

                // ensures the mouse is a pointer which tells client to click
                map.getCanvas().style.cursor = 'pointer';

                // GeoJSON source for purple dot which is for event
                map.addSource('single-point', {
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": []
                    }
                });

                // at the layer for the purple dot for event
                map.addLayer({
                    "id": "point",
                    "source": "single-point",
                    "type": "circle",
                    "paint": {
                        "circle-radius": 10,
                        "circle-color": '#B400E1'
                    }
                });

                // when the map is clicked do...
                map.on('click', function (event) {

                    // get the lng and lat of where the mouse clicked
                    var lng = event.lngLat.lng;
                    var lat = event.lngLat.lat;

                    coordinates = [lng, lat];

                    // put the coordinates in the createEventController's $scope.event.coordinates
                    scope.event.coordinates = coordinates;

                    // geometry for where the event purple dot goes in the map
                    var geometry = {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [lng, lat]
                        }
                    };

                    // URL necessary in order to the reverse geocoding
                    var reverseGeocodingURL = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + lng + ',' + lat + '.json?access_token=pk.eyJ1IjoiaWJvdWdlIiwiYSI6ImNqY2wzaXJ5YTAycWIzM2pyb3JhN20yenkifQ.jhimhHWkb-6GD3Tq8bvCKA';

                    // request the reverse geoding response through the mapbox
                    // geocoding api
                    $http.get(reverseGeocodingURL).then(function (response) {
                        // put the responses "place_name" in variable
                        locationName = response.data.features[0].place_name;


                        // this is where the city and state is fetched from the location clicked
                        var a = response.data.features;

                        // looking for the index of "place"- city of location
                        var b = a.map(function(x){
                            var parsedString = x.id.split(".");
                            x.id = parsedString[0];
                            return x.id;
                        }).indexOf("place");

                        // looking for the index of "region"- state of location
                        var c = a.map(function(x){
                            var parsedString = x.id.split(".");
                            x.id = parsedString[0];
                            return x.id;
                        }).indexOf("region");


                        //city found
                        city = response.data.features[b].text;

                        // state found
                        state = response.data.features[c].text;


                        // put address in "createEventControllers" $scope.event.address1
                        scope.event.address1 = locationName;

                        // put city in "createEventControllers" $scope.event.city
                        scope.event.city = city;

                        // put state in "createEventControllers" $scope.event.state
                        scope.event.state = state;

                        // set the input inside the geocoding search input to the
                        // address of where the mouse was clicked on the map
                        geocoder.setInput(locationName === 'undefined' ? lat + ', ' + lng : locationName);

                        // ensures step 2 submit button
                        // can be clicked and submitted
                        scope.canSubmit = true;
                    });

                    // get the purple dot and place it on the map
                    map.getSource('single-point').setData(geometry);

                });

                // Once the geocoder's result is chosen
                // place a purple event dot on the screen
                geocoder.on('result', function (event) {
                    map.getSource('single-point').setData(event.result.geometry);

                    // this is where the city and state is fetched from the location searched
                    var a = event.result.context;

                    // looking for the index of "place"- city of location
                    var b = a.map(function(x){
                        var parsedString = x.id.split(".");
                        x.id = parsedString[0];
                        return x.id;
                    }).indexOf("place");

                    // looking for the index of "region"- state of location
                    var c = a.map(function(x){
                        var parsedString = x.id.split(".");
                        x.id = parsedString[0];
                        return x.id;
                    }).indexOf("region");

                    // city found
                    city = event.result.context[b].text;

                    // state found
                    state = event.result.context[c].text;


                    coordinates = event.result.center;
                    locationName = event.result.place_name;

                    // put the coordinates in the createEventController's $scope.event.coordinates
                    scope.event.coordinates = coordinates;

                    // put address in "createEventControllers" $scope.event.address1
                    scope.event.address1 = locationName;

                    // put city in "createEventControllers" $scope.event.city
                    scope.event.city = city;

                    // put state in "createEventControllers" $scope.event.state
                    scope.event.state = state;

                    // ensures step 2 submit button
                    // can be clicked and submitted
                    scope.canSubmit = true;
                });
            });
        };
    }]);
})();