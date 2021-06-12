(function () {
  "use strict";

  ibouge.service("ProfileSetupMapService", [
    "$rootScope",
    "$http",
    "UserService",
    function ($rootScope, $http, UserService) {
      var coordinates = [];
      var stateBbox = [];
      var bbox = {};
      var clientsCityName = "";
      var centerOfCircle = {};
      var bbox2 = {};
      var clientsCityName2 = "";
      var centerOfCircle2 = {};
      var bbox3 = {};
      var clientsCityName3 = "";
      var centerOfCircle3 = {};

      this.loadProfileSetupMap = function (element, args) {
        // means an error message can be displayed
        // when user hasn't searched for a new city
        // $rootScope.searchForCityErrorMessage = true;

        // get the element to attach the map to
        var element = document.getElementById("followLocation1Map");
        var element2 = document.getElementById("followLocation2Map");
        var element3 = document.getElementById("followLocation3Map");
        // create the new Mapboxgl map
        var map = new mapboxgl.Map({
          container: element,
          style: "https://api.maptiler.com/maps/positron/style.json?key=RGierAHokphISswP6JTB",
          interactive: false, // this means none of the zoom or scroll etc will work
        });
        var map2 = new mapboxgl.Map({
          container: element2,
          style: "https://api.maptiler.com/maps/positron/style.json?key=RGierAHokphISswP6JTB",
          interactive: false, // this means none of the zoom or scroll etc will work
        });
        var map3 = new mapboxgl.Map({
          container: element3,
          style: "https://api.maptiler.com/maps/positron/style.json?key=RGierAHokphISswP6JTB",
          interactive: false, // this means none of the zoom or scroll etc will work
        });
        // ibouge mapboxgl token to be used with their APIs
        mapboxgl.accessToken =
          "pk.eyJ1IjoiaWJvdWdlIiwiYSI6ImNqY2wzaXJ5YTAycWIzM2pyb3JhN20yenkifQ.jhimhHWkb-6GD3Tq8bvCKA";

        // create geocoder
        var geocoder = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          types: "place", // geocoder will on search for cities
        });
        var geocoder2 = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          types: "place", // geocoder will on search for cities
        });
        var geocoder3 = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          types: "place", // geocoder will on search for cities
        });

        // get element to attach the geocoder search bar to
        document.getElementById("followLocation1Search").appendChild(geocoder.onAdd(map));
        document.getElementById("followLocation2Search").appendChild(geocoder2.onAdd(map2));
        document.getElementById("followLocation3Search").appendChild(geocoder3.onAdd(map3));

        var myCircle = undefined;
        var myCircle2 = undefined;
        var myCircle3 = undefined;
        // after the geocoder has found it's result
        // it moves the map to the result
        geocoder.on("result", function (event) {
          $rootScope.profileSetupMapFunction(2);
          // var ensures "save" button cannot
          // be clicked until the map end it's move
          //   $rootScope.canClickSave = false;

          //   $rootScope.searchForCityErrorMessage = false;

          // after the map has reached it's destination
          map.once("moveend", function () {
            // var to hold the name of the city
            // the user just searched for
            clientsCityName = event.result.text;
            console.log(clientsCityName);
            // already an orange circle on the screen
            // if so then remove it
            if (myCircle !== undefined) {
              myCircle.remove();
            }

            // if map interactivity is disabled
            // this will run when modal is first loaded
            // because interactivity is disabled
            // when the map is first loaded
            // if (!map.scrollZoom.isEnabled()) {
            //   // add back all of the maps interactivity
            //   map.scrollZoom.enable();
            //   map.boxZoom.enable();
            //   map.dragPan.enable();
            //   map.dragRotate.enable();
            //   map.keyboard.enable();
            //   map.doubleClickZoom.enable();
            //   map.touchZoomRotate.enable();

            //   // add zoom feature to map screen, bottom right corner
            //   map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
            // }

            // get the center of the current map
            // so we know where to put the orange circle
            var centerOfMap = map.getCenter();

            // create a circle to place on the map so the user can
            // choose a radius from the area they want to follow
            // circle will be placed in the middle of the map after
            // geocoder pans the map to the new position
            myCircle = new MapboxCircle(centerOfMap, 20000, {
              editable: true,
              minRadius: 1500,
              strokeColor: "#FAC82D",
              strokeWeight: 2,
              fillColor: "#FAC82D",
              fillOpacity: 0.25,
            }).addTo(map, "place_city");

            // gets the circles bbox and center directly
            // after it loads on the screen
            bbox = myCircle.getBounds();
            centerOfCircle = myCircle.getCenter();
            $rootScope.profileSetupMapFunction(4);

            // when the client changes the radius
            // update the circles bbox and center coordinates
            // myCircle.on("radiuschanged", function (circleObject) {
            //   bbox = circleObject.getBounds();
            //   centerOfCircle = circleObject.getCenter();
            // });

            // // when the circles center is changed
            // // update its bbox and center coordinates
            // myCircle.on("centerchanged", function (circleObject) {
            //   bbox = circleObject.getBounds();
            //   centerOfCircle = circleObject.getCenter();
            // });

            // don't allow user to click
            // save until everything has loaded
            // $rootScope.canClickSave = true;
          });
        });
        geocoder2.on("result", function (event) {
          $rootScope.profileSetupMapFunction(2);
          map2.once("moveend", function () {
            clientsCityName2 = event.result.text;
            console.log(clientsCityName2);
            if (myCircle2 !== undefined) {
              myCircle2.remove();
            }
            var centerOfMap2 = map2.getCenter();
            myCircle2 = new MapboxCircle(centerOfMap2, 20000, {
              editable: true,
              minRadius: 1500,
              strokeColor: "#FAC82D",
              strokeWeight: 2,
              fillColor: "#FAC82D",
              fillOpacity: 0.25,
            }).addTo(map, "place_city");
            bbox2 = myCircle2.getBounds();
            centerOfCircle2 = myCircle2.getCenter();
            $rootScope.profileSetupMapFunction(4);
          });
        });
        geocoder3.on("result", function (event) {
          $rootScope.profileSetupMapFunction(2);
          map3.once("moveend", function () {
            clientsCityName3 = event.result.text;
            console.log(clientsCityName3);
            if (myCircle3 !== undefined) {
              myCircle3.remove();
            }
            var centerOfMap3 = map3.getCenter();
            myCircle3 = new MapboxCircle(centerOfMap3, 20000, {
              editable: true,
              minRadius: 1500,
              strokeColor: "#FAC82D",
              strokeWeight: 2,
              fillColor: "#FAC82D",
              fillOpacity: 0.25,
            }).addTo(map, "place_city");
            bbox3 = myCircle3.getBounds();
            centerOfCircle3 = myCircle3.getCenter();
            $rootScope.profileSetupMapFunction(4);
          });
        });

        // map style for picking the city
        // var pickCityStyle = {
        //     "version": 8,
        //     "name": "ibougeSelectCityLevelStyle",
        //     "metadata": {
        //         "mapbox:type": "template"
        //     },
        //     "sources": {
        //         "openmaptiles": {
        //             "type": "vector",
        //             "url": "https://d3mindkzn79efp.cloudfront.net/data/earth-vector.json"
        //         }
        //     },
        //     "sprite": "https://rawgit.com/lukasmartinelli/osm-liberty/gh-pages/sprites/osm-liberty",
        //     "glyphs": "https://orangemug.github.io/font-glyphs/glyphs/{fontstack}/{range}.pbf",
        //     "layers": [
        //         {
        //             "id": "background",
        //             "type": "background",
        //             "paint": {
        //                 "background-color": "#F9BB96"
        //             }
        //         },
        //         {
        //             "id": "water",
        //             "type": "fill",
        //             "metadata": {},
        //             "source": "openmaptiles",
        //             "source-layer": "water",
        //             "paint": {
        //                 "fill-color": "#F6F7F9",
        //                 "fill-translate-anchor": "map"
        //             }
        //         },
        //         {
        //             "id": "boundary_3",
        //             "type": "line",
        //             "metadata": {},
        //             "source": "openmaptiles",
        //             "source-layer": "boundary",
        //             "filter": [
        //                 "all",
        //                 [
        //                     "in",
        //                     "admin_level",
        //                     3,
        //                     4
        //                 ]
        //             ],
        //             "layout": {
        //                 "line-join": "round"
        //             },
        //             "paint": {
        //                 "line-color": "#FFFFFF",
        //                 "line-dasharray": [
        //                     5,
        //                     1
        //                 ],
        //                 "line-width": {
        //                     "base": 1,
        //                     "stops": [
        //                         [
        //                             4,
        //                             0.4
        //                         ],
        //                         [
        //                             5,
        //                             1
        //                         ],
        //                         [
        //                             12,
        //                             1.8
        //                         ]
        //                     ]
        //                 }
        //             }
        //         },
        //         {
        //             "id": "boundary_2",
        //             "type": "line",
        //             "metadata": {},
        //             "source": "openmaptiles",
        //             "source-layer": "boundary",
        //             "filter": [
        //                 "all",
        //                 [
        //                     "==",
        //                     "admin_level",
        //                     2
        //                 ]
        //             ],
        //             "layout": {
        //                 "line-cap": "round",
        //                 "line-join": "round"
        //             },
        //             "paint": {
        //                 "line-color": "#F6F7F9",
        //                 "line-width": {
        //                     "base": 1,
        //                     "stops": [
        //                         [
        //                             3,
        //                             1
        //                         ],
        //                         [
        //                             5,
        //                             1.2
        //                         ],
        //                         [
        //                             12,
        //                             3
        //                         ]
        //                     ]
        //                 }
        //             }
        //         },
        //         {
        //             "id": "place_city",
        //             "type": "symbol",
        //             "metadata": {},
        //             "source": "openmaptiles",
        //             "source-layer": "place",
        //             "minzoom": 0,
        //             "filter": [
        //                 "all",
        //                 [
        //                     "==",
        //                     "class",
        //                     "city"
        //                 ]
        //             ],
        //             "layout": {
        //                 "icon-image": {
        //                     "base": 1,
        //                     "stops": [
        //                         [
        //                             0,
        //                             "dot_9"
        //                         ]
        //                     ]
        //                 },
        //                 "text-anchor": "bottom",
        //                 "text-field": "{name_en}",
        //                 "text-font": [
        //                     "Roboto Medium"
        //                 ],
        //                 "text-max-width": 8,
        //                 "text-offset": [
        //                     0,
        //                     0
        //                 ],
        //                 "text-size": {
        //                     "base": 1.8,
        //                     "stops": [
        //                         [
        //                             7,
        //                             17
        //                         ],
        //                         [
        //                             11,
        //                             26
        //                         ]
        //                     ]
        //                 },
        //                 "icon-allow-overlap": true,
        //                 "icon-optional": false
        //             },
        //             "paint": {
        //                 "text-color": "#7a7a7a"
        //             }
        //         }
        //     ],
        //     "id": "map-OSM"
        // };
        // // create variables from sent arguments(args)
        // var countryName = sessionStorage.profileSetupCountryName;
        // var countryISOKey = sessionStorage.profileSetupCountryISOKey;
        // countryISOKey.toUpperCase();
        // var stateName = args.profileSetupStateName;
        // var longitude = isNaN(args.profileSetupLongitude) ? 0 : parseFloat(args.profileSetupLongitude);
        // var latitude = isNaN(args.profileSetupLatitude) ? 0 : parseFloat(args.profileSetupLatitude);
        // // Load the OSM open source vector tiles map
        // // OSM map link is using Cloudfront CDN
        // var map = new mapboxgl.Map({
        //     container: element,
        //     style: pickCityStyle,
        //     // style: 'https://api.maptiler.com/maps/positron/style.json?key=RGierAHokphISswP6JTB',
        //     zoom: 7,
        //     // this center long and lat will only be used for states
        //     // that were not found in the Geocoder query but that
        //     // do have an attached longitude and latitude
        //     // other than that the GeoCoder does all of the map movement
        //     center: [longitude, latitude]
        // });
        // // fixes bug with map not loading in div correctly
        // map.getCanvas().style.position = 'relative';
        // // changes the message above the map to appropriate text
        // $rootScope.profileSetupMapFunction(3);
        // // ibouge mapbox.com access token
        // mapboxgl.accessToken = 'pk.eyJ1IjoiaWJvdWdlIiwiYSI6ImNqY2wzaXJ5YTAycWIzM2pyb3JhN20yenkifQ.jhimhHWkb-6GD3Tq8bvCKA';
        // // create a GeoCoder so we can search for the state's info and be sent
        // // to the respective state on the map by means of the GeoCoder
        // var geoCoder = new MapboxGeocoder({
        //     accessToken: mapboxgl.accessToken,
        //     // makes sure the state is only queried in respective country
        //     country: countryISOKey,
        //     // makes sure the query only looks for states
        //     types: "region"
        // });
        // // add the geoCoder to the top right of the map screen
        // map.addControl(geoCoder, 'top-right');
        // // Variable for in the event the results query returns nothing and there is
        // // longitude and latitude, remove the geoCode from map
        // var geoCoderIsRemoved = false;
        // // variable to be used during query of state
        // // example "Texas, United States of America"
        // var stateCountry = stateName + ', ' + countryISOKey;
        // // run the query and place query in variable
        // var placeToGo = geoCoder.query(stateCountry);
        // // after the query runs and returns results
        // geoCoder.on("results", function(resultsInfo) {
        //     // if the query returns a good result then go to
        //     // that result on the map
        //     if (resultsInfo.features.length > 0) {
        //         // variable to hold the bbox coordinates of
        //         // the state clicked, if there are any
        //         stateBbox = resultsInfo.features[0].bbox;
        //         // geoCoder will be removed in this if statement
        //         geoCoderIsRemoved = true;
        //         geoCoder.setProximity(placeToGo);
        //         // once the map is done getting to it's location(moving)
        //         // remove the GeoCoder
        //         map.once('moveend', function () {
        //             map.removeControl(geoCoder);
        //         });
        //         // else if it does not return a result and
        //         // it doesn't have a longitude and latitude
        //         // then zoom to the country the state belongs to
        //     } else if (!longitude || !latitude) {
        //         // geoCoder will be removed in this if statement
        //         geoCoderIsRemoved = true;
        //         // remove the first geoCoder so we can start another query
        //         map.removeControl(geoCoder);
        //         // create new GeoCoder
        //         var newGeocoder = new MapboxGeocoder({
        //             accessToken: mapboxgl.accessToken,
        //             // guarantees only country name are queried
        //             types: "country"
        //         });
        //         // add the newGeoCoder to the map
        //         map.addControl(newGeocoder, "top-right");
        //         // run the new query to search for the country
        //         var newQuery = newGeocoder.query(countryName);
        //         // upon successful query zoom map to the countries area
        //         // NOTE: BECAUSE SOME COUNTRIES OWN AREAS OUT OF THERE CONTINENTAL
        //         // AREA (USA, OUTLYING ISLANDS) THE MAP MAY NOT ZOOM TO ONLY THE
        //         // CONTINENTAL AREAS
        //         newGeocoder.setProximity(newQuery);
        //         // once the map is done getting to it's location(moving)
        //         // remove the Geocoder
        //         map.once('moveend', function () {
        //             map.removeControl(newGeocoder);
        //         });
        //     }
        //     // geoCoder hasn't been removed, remove it now
        //     if(geoCoderIsRemoved === false) {
        //         map.removeControl(geoCoder);
        //     }
        //     // This function is necessary to pass to the 'mouseenter' event a few lines below
        //     // the reason you have to create a function is for when you want to turn
        //     // that event listener "map.off", it's needs a function passed to it
        //     function mouseToPointer() {
        //         map.getCanvas().style.cursor = 'pointer';
        //     }
        //     // This function is necessary to pass to the 'mouseleave' event a few lines below
        //     // the reason you have to create a function is for when you want to turn
        //     // that event listener "map.off", it's needs a function passed to it
        //     function mouseBackToCursor() {
        //         map.getCanvas().style.cursor = '';
        //     }
        //     // Scroll over major city, change cursor to clickable
        //     map.on('mouseenter', 'place_city', mouseToPointer);
        //     // Scroll of major city, change cursor back to normal hand
        //     map.on('mouseleave', 'place_city', mouseBackToCursor);
        //     // This function is necessary to pass to the 'click' event below
        //     // the reason you have to create a function is for when you want to turn
        //     // that event listener "map.off", it's needs a function passed to it
        //     function clickedCity(event) {
        //         // profile setup step 3 is at step 4
        //         $rootScope.profileSetupMapFunction(4);
        //         // return the cursor back to normal
        //         map.getCanvas().style.cursor = '';
        //         // when a city is chosen(clicked) turn of the
        //         // mouse event listeners
        //         map.off('mouseenter', 'place_city', mouseToPointer);
        //         map.off('mouseleave', 'place_city', mouseBackToCursor);
        //         map.off('click', 'place_city', clickedCity);
        //         // var for lng/lat based on where the mouse is clicked
        //         var cityLongitude = event.lngLat.lng;
        //         var cityLatitude = event.lngLat.lat;
        //         // change the maps style to city zoom in version
        //         map.setStyle('https://api.maptiler.com/maps/positron/style.json?key=RGierAHokphISswP6JTB');
        //         // create new geoCoder for new search
        //         var cityGeoCoder = new MapboxGeocoder({
        //             accessToken: mapboxgl.accessToken,
        //             language: 'en',
        //             types: 'place',
        //             proximity: {    // base query results on things closest to previous mouse click
        //                 longitude: cityLongitude,
        //                 latitude: cityLatitude
        //             }
        //         });
        //         // if the query returned a bounding box
        //         // then use that bbox to filter geocoder
        //         // results to only cities found with
        //         // said bounding box
        //         if(stateBbox.length > 0) {
        //             cityGeoCoder.options.bbox = stateBbox;
        //         }
        //         // add the new geoCoder
        //         map.addControl(cityGeoCoder);
        //         // var for the city previously clicked
        //         var cityName = event.features[0].properties.name_en;
        //         // var to hold the clients chosen city
        //         // to be sent to database
        //         clientsCityName = cityName;
        //         // query the geocoder to search for the city to zoom into
        //         // also send the map to the result of the query
        //         var getQuery = cityGeoCoder.query(cityName);
        //         // adding the stateName as shown below rather than the one above
        //         // may make the search better and more accurate
        //         // var getQuery = cityGeoCoder.query(cityName + ', ' + stateName);
        //         // after the cityGeocoder query returns it's results
        //         cityGeoCoder.on('results', function (results) {
        //             // if the geocoder returns results then use those
        //             // coordinates to place the circle. If not
        //             // then use the coordinates where the mouse was clicked
        //             // and then fly to that location
        //             if(results.features.length > 0) {
        //                 coordinates = results.features[0].center;
        //             } else {
        //                 coordinates = [cityLongitude, cityLatitude];
        //                 map.flyTo({
        //                     center: coordinates,
        //                     zoom: 9
        //                 })
        //             }
        //         });
        //         // Ensures previous geocoder is removed from map
        //         // and adds the last geocoder to be used for searching
        //         map.once('moveend', function (event) {
        //             // necessary to resize the map because of the right side
        //             // list of microblogs. If we didn't resize then the
        //             // microblogs would not be updated in said list when
        //             // the map is dragged toward the list(right side of the screen)
        //             map.resize();
        //             // remove previous geocoder
        //             map.removeControl(cityGeoCoder);
        //             // adds navigation control for zooming
        //             map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
        //             // create a circle to place on the map so the user can
        //             // choose a radius from the area they want to follow
        //             var myCircle = new MapboxCircle(coordinates, 10000, {
        //                 editable: true,
        //                 minRadius: 1500,
        //                 strokeColor: '#FAC82D',
        //                 strokeWeight: 2,
        //                 fillColor: '#FAC82D',
        //                 fillOpacity: 0.25
        //             }).addTo(map, 'place_city');
        //             // get the current bounding box
        //             bbox = myCircle.getBounds();
        //             centerOfCircle = myCircle.getCenter();
        //             // whenever the radius is edited by user
        //             // change bbox variable to new bounding box
        //             myCircle.on('radiuschanged', function (circleObj) {
        //                 bbox = circleObj.getBounds();
        //                 centerOfCircle = circleObj.getCenter();
        //             });
        //             // whenever the radius is edited by user
        //             // change bbox variable to new bounding box
        //             myCircle.on('centerchanged', function (circleObj) {
        //                 bbox = circleObj.getBounds();
        //                 centerOfCircle = circleObj.getCenter();
        //             });
        //         });
        //         // This can be used once we can get an accurate lng/lat from
        //         // the place_city. Currently the only way to get a lng/lat is
        //         // to use where the mouse is clicked
        //         // map.flyTo({
        //         //     center: [cityLongitude, cityLatitude],
        //         //     zoom: 13
        //         //
        //         // });
        //     }
        //     // Click major city, take map to new area
        //     map.on('click', 'place_city', clickedCity);
        // });
      };

      // function to return the users selected areas bounding box
      this.getCityAndBoundingBox = function () {
        var clientsCityAndBbox = {
          bbox: bbox,
          cityName: clientsCityName,
          center: centerOfCircle,
          bbox2: bbox2,
          cityName2: clientsCityName2,
          center2: centerOfCircle2,
          bbox3: bbox3,
          cityName3: clientsCityName3,
          center3: centerOfCircle3,
        };

        return clientsCityAndBbox;
      };
    },
  ]);
})();
