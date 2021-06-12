(function () {
  "use strict";

  ibouge.service("MapOSMService", [
    "$rootScope",
    "$uibModal",
    "MicroblogService",
    "AddMicroblogsService",
    "AddUsersToMapService",
    "$state",
    "AddEventsService",
    function (
      $rootScope,
      $uibModal,
      MicroblogService,
      AddMicroblogsService,
      AddUsersToMapService,
      $state,
      AddEventsService,
    ) {
      var firstMapMoveEnd = 0;

      this.loadOSMMap = function (element, args) {
        // map style for picking the city
        var pickCityStyle = {
          version: 8,
          name: "ibougeSelectCityLevelStyle",
          metadata: {
            "mapbox:type": "template",
          },
          sources: {
            openmaptiles: {
              type: "vector",
              url: "https://d3mindkzn79efp.cloudfront.net/data/earth-vector.json",
            },
          },
          sprite: "https://rawgit.com/lukasmartinelli/osm-liberty/gh-pages/sprites/osm-liberty",
          glyphs: "https://orangemug.github.io/font-glyphs/glyphs/{fontstack}/{range}.pbf",
          layers: [
            {
              id: "background",
              type: "background",
              paint: {
                "background-color": "#F9BB96",
              },
            },
            {
              id: "water",
              type: "fill",
              metadata: {},
              source: "openmaptiles",
              "source-layer": "water",
              paint: {
                "fill-color": "#F6F7F9",
                "fill-translate-anchor": "map",
              },
            },
            {
              id: "boundary_3",
              type: "line",
              metadata: {},
              source: "openmaptiles",
              "source-layer": "boundary",
              filter: ["all", ["in", "admin_level", 3, 4]],
              layout: {
                "line-join": "round",
              },
              paint: {
                "line-color": "#FFFFFF",
                "line-dasharray": [5, 1],
                "line-width": {
                  base: 1,
                  stops: [
                    [4, 0.4],
                    [5, 1],
                    [12, 1.8],
                  ],
                },
              },
            },
            {
              id: "boundary_2",
              type: "line",
              metadata: {},
              source: "openmaptiles",
              "source-layer": "boundary",
              filter: ["all", ["==", "admin_level", 2]],
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
              paint: {
                "line-color": "#F6F7F9",
                "line-width": {
                  base: 1,
                  stops: [
                    [3, 1],
                    [5, 1.2],
                    [12, 3],
                  ],
                },
              },
            },
            {
              id: "place_city",
              type: "symbol",
              metadata: {},
              source: "openmaptiles",
              "source-layer": "place",
              minzoom: 5,
              filter: ["all", ["==", "class", "city"]],
              layout: {
                "icon-image": {
                  base: 1,
                  stops: [[0, "dot_9"]],
                },
                "text-anchor": "bottom",
                "text-field": "{name_en}",
                "text-font": ["Roboto Medium"],
                "text-max-width": 8,
                "text-offset": [0, 0],
                "text-size": {
                  base: 1.8,
                  stops: [
                    [7, 16],
                    [11, 26],
                  ],
                },
                "icon-allow-overlap": true,
                "icon-optional": false,
              },
              paint: {
                "text-color": "#7a7a7a",
              },
            },
          ],
          id: "map-OSM",
        };

        // create variables from sent arguments(args)
        var countryName = sessionStorage.countryName;
        var countryISOKey = sessionStorage.countryISOKey;
        countryISOKey.toUpperCase();
        var stateName = args.stateName;
        var longitude = isNaN(args.longitude) ? 0 : parseFloat(args.longitude);
        var latitude = isNaN(args.latitude) ? 0 : parseFloat(args.latitude);

        // Get all of the microblogs and users and
        // events to be used in the addNewSources()
        var microblogs = args.allMicroblogs;
        var users = args.allUsers;
        var events = args.allEvents;

        // Load the OSM open source vector tiles map
        // OSM map link is using Cloudfront CDN
        var map = new mapboxgl.Map({
          container: element,
          style: pickCityStyle,
          // style: 'https://api.maptiler.com/maps/positron/style.json?key=RGierAHokphISswP6JTB',
          zoom: 7,
          // this center long and lat will only be used for states
          // that were not found in the Geocoder query but that
          // do have an attached longitude and latitude
          // other than that the GeoCoder does all of the map movement
          center: [longitude, latitude],
        });

        // ibouge mapbox.com access token
        mapboxgl.accessToken =
          "pk.eyJ1IjoiaWJvdWdlIiwiYSI6ImNqY2wzaXJ5YTAycWIzM2pyb3JhN20yenkifQ.jhimhHWkb-6GD3Tq8bvCKA";

        // create a GeoCoder so we can search for the state's info and be sent
        // to the respective state on the map by means of the GeoCoder
        var geoCoder = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          // makes sure the state is only queried in respective country
          country: countryISOKey,
          // makes sure the query only looks for states
          types: "region",
        });

        // add the geoCoder to the top right of the map screen
        map.addControl(geoCoder, "top-right");

        // Variable for in the event the results query returns nothing and there is
        // longitude and latitude, remove the geoCode from map
        var geoCoderIsRemoved = false;

        // variable to be used during query of state
        // example "Texas, United States of America"
        var stateCountry = stateName + ", " + countryISOKey;

        // run the query and place query in variable
        var placeToGo = geoCoder.query(stateCountry);

        // after the query runs and returns results
        geoCoder.on("results", function (resultsInfo) {
          // if the query returns a good result then go to
          // that result on the map
          if (resultsInfo.features.length > 0) {
            // geoCoder will be removed in this if statement
            geoCoderIsRemoved = true;

            geoCoder.setProximity(placeToGo);

            // once the map is done getting to it's location(moving)
            // remove the GeoCoder
            map.once("moveend", function () {
              map.removeControl(geoCoder);
            });

            // else if it does not return a result and
            // it doesn't have a longitude and latitude
            // then zoom to the country the state belongs to
          } else if (!longitude || !latitude) {
            // geoCoder will be removed in this if statement
            geoCoderIsRemoved = true;

            // remove the first geoCoder so we can start another query
            map.removeControl(geoCoder);

            // create new GeoCoder
            var newGeocoder = new MapboxGeocoder({
              accessToken: mapboxgl.accessToken,
              // guarantees only country name are queried
              types: "country",
            });

            // add the newGeoCoder to the map
            map.addControl(newGeocoder, "top-right");

            // run the new query to search for the country
            var newQuery = newGeocoder.query(countryName);

            // upon successful query zoom map to the countries area
            // NOTE: BECAUSE SOME COUNTRIES OWN AREAS OUT OF THERE CONTINENTAL
            // AREA (USA, OUTLYING ISLANDS) THE MAP MAY NOT ZOOM TO ONLY THE
            // CONTINENTAL AREAS
            newGeocoder.setProximity(newQuery);

            // once the map is done getting to it's location(moving)
            // remove the Geocoder
            map.once("moveend", function () {
              map.removeControl(newGeocoder);
            });
          }

          // geoCoder hasn't been removed, remove it now
          if (geoCoderIsRemoved === false) {
            map.removeControl(geoCoder);
          }

          // This function is necessary to pass to the 'mouseenter' event a few lines below
          // the reason you have to create a function is for when you want to turn
          // that event listener "map.off", it's needs a function passed to it
          function mouseToPointer() {
            map.getCanvas().style.cursor = "pointer";
          }

          // This function is necessary to pass to the 'mouseleave' event a few lines below
          // the reason you have to create a function is for when you want to turn
          // that event listener "map.off", it's needs a function passed to it
          function mouseBackToCursor() {
            map.getCanvas().style.cursor = "";
          }

          // Scroll over major city, change cursor to clickable
          map.on("mouseenter", "place_city", mouseToPointer);

          // Scroll of major city, change cursor back to normal hand
          map.on("mouseleave", "place_city", mouseBackToCursor);

          // This function is necessary to pass to the 'click' event below
          // the reason you have to create a function is for when you want to turn
          // that event listener "map.off", it's needs a function passed to it
          function clickedCity(event) {
            $rootScope.$broadcast("cityClicked");

            // return the cursor back to normal
            map.getCanvas().style.cursor = "";

            // when a city is chosen(clicked) turn of the
            // mouse event listeners
            map.off("mouseenter", "place_city", mouseToPointer);
            map.off("mouseleave", "place_city", mouseBackToCursor);
            map.off("click", "place_city", clickedCity);

            // var for lng/lat based on where the mouse is clicked
            var cityLongitude = event.lngLat.lng;
            var cityLatitude = event.lngLat.lat;

            // change the maps style to city zoom in version
            map.setStyle("https://api.maptiler.com/maps/positron/style.json?key=RGierAHokphISswP6JTB");

            // create new geoCoder for new search
            var cityGeoCoder = new MapboxGeocoder({
              accessToken: mapboxgl.accessToken,
              language: "en",
              proximity: {
                // base query results on things closest to previous mouse click
                longitude: cityLongitude,
                latitude: cityLatitude,
              },
            });

            // add the new geoCoder
            map.addControl(cityGeoCoder);

            // var for the city previously clicked
            var cityName = event.features[0].properties.name_en;

            // query the geocoder to search for the city to zoom into
            // also send the map to the result of the query
            var getQuery = cityGeoCoder.query(cityName);

            // adding the stateName as shown below rather than the one above
            // may make the search better and more accurate
            // var getQuery = cityGeoCoder.query(cityName + ', ' + stateName);

            // Ensures previous geocoder is removed from map
            // and adds the last geocoder to be used for searching
            map.once("moveend", function (event) {
              // necessary to resize the map because of the right side
              // list of microblogs. If we didn't resize then the
              // microblogs would not be updated in said list when
              // the map is dragged toward the list(right side of the screen)
              map.resize();

              // remove previous geocoder
              map.removeControl(cityGeoCoder);

              // create new geocoder
              var zoomedInGeocode = new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
              });

              // attach new geocoder to the map
              map.addControl(zoomedInGeocode);
            });

            // This can be used once we can get an accurate lng/lat from
            // the place_city. Currently the only way to get a lng/lat is
            // to use where the mouse is clicked
            // map.flyTo({
            //     center: [cityLongitude, cityLatitude],
            //     zoom: 13
            //
            // });

            // create a geoLocator to track user at their request
            var geoLocator = new mapboxgl.GeolocateControl({
              positionOptions: {
                enableHighAccuracy: true,
              },
              trackUserLocation: true,
            });

            // add the geoLocator to the bottom right of the map screen
            map.addControl(geoLocator, "bottom-right");

            // adds navigation control for zooming
            map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

            // if data has changed try loading new sources
            var loadNewSource = function () {
              // if the new style is loaded
              if (map.isStyleLoaded()) {
                // add the new microblogs to the map
                AddMicroblogsService.addMicroblogIconSource(map, microblogs);
                AddUsersToMapService.addUsersToMap(map, users);
                AddEventsService.addEventIconSource(map, events);

                // turn of data change listener
                map.off("data", loadNewSource);
              }
            };

            // When data is changed or finished loading call loadSource()
            // this refers to when the new style is done loading
            // the style which gets loaded when the chosen city is clicked
            map.on("data", loadNewSource);

            // ensure the icons are placed on the map directly
            // after the map gets done loading
            map.on("load", function () {
              AddMicroblogsService.mapMoveEventChangeIcons(map, microblogs);
              AddUsersToMapService.mapMoveEventChangeIcons(map, users);
              AddEventsService.mapMoveEventChangeIcons(map, events);
            });

            // when the map has been moved place microblogs icons
            // currently on map in the right side list
            map.on("moveend", function () {
              ++firstMapMoveEnd;

              if (firstMapMoveEnd > 1) {
                AddMicroblogsService.mapMoveEventChangeIcons(map, microblogs);
                AddUsersToMapService.mapMoveEventChangeIcons(map, users);
                AddEventsService.mapMoveEventChangeIcons(map, events);
                $rootScope.$broadcast("cityClicked");
              }
            });
          }

          // Click major city, take map to new area
          map.on("click", "place_city", clickedCity);

          // when user has mouse event with the main microblog
          // and user icons and events in the top left of the map
          // makes icons appear and disappear but changing the
          // icons circle-opacity to 0 and 1 respectively
          // also make icons popup and clickable events to only
          // work when appropriate
          $rootScope.$on("mapIconEventMapOverview", function (event, params) {
            switch (params.broadcastID) {
              case "mouseOverMicroblogIcon":
                map.setPaintProperty("event_icon", "circle-opacity", 0);
                map.setPaintProperty("user_icon", "circle-opacity", 0);
                map.setPaintProperty("microblog_icon", "circle-opacity", 1);
                break;

              case "mouseLeaveMicroblogIcon":
                map.setPaintProperty("microblog_icon", "circle-opacity", 0);

                if (params.clickedIcon === "user") {
                  map.setPaintProperty("user_icon", "circle-opacity", 1);
                  map.setPaintProperty("event_icon", "circle-opacity", 0);
                } else {
                  map.setPaintProperty("event_icon", "circle-opacity", 1);
                  map.setPaintProperty("user_icon", "circle-opacity", 0);
                }

                break;

              case "mouseClickMicroblogIcon":
                map.on("mouseenter", "microblog_icon", mouseEnterMicroblogIcon);
                map.on("click", "microblog_icon", clickMicroblogIcon);
                map.off("mouseenter", "user_icon", mouseEnterUserIcon);
                map.off("click", "user_icon", mouseClickUserIcon);
                map.off("mouseenter", "event_icon", mouseEnterEventIcon);
                map.off("click", "event_icon", mouseClickEventIcon);
                break;

              case "mouseOverUserIcon":
                map.setPaintProperty("user_icon", "circle-opacity", 1);
                map.setPaintProperty("microblog_icon", "circle-opacity", 0);
                map.setPaintProperty("event_icon", "circle-opacity", 0);
                break;

              case "mouseLeaveUserIcon":
                map.setPaintProperty("user_icon", "circle-opacity", 0);

                if (params.clickedIcon === "microblog") {
                  map.setPaintProperty("microblog_icon", "circle-opacity", 1);
                  map.setPaintProperty("event_icon", "circle-opacity", 0);
                } else {
                  map.setPaintProperty("event_icon", "circle-opacity", 1);
                  map.setPaintProperty("microblog_icon", "circle-opacity", 0);
                }

                break;

              case "mouseClickUserIcon":
                map.off("mouseenter", "event_icon", mouseEnterEventIcon);
                map.off("click", "event_icon", mouseClickEventIcon);
                map.off("mouseenter", "microblog_icon", mouseEnterMicroblogIcon);
                map.off("click", "microblog_icon", clickMicroblogIcon);
                map.on("mouseenter", "user_icon", mouseEnterUserIcon);
                map.on("click", "user_icon", mouseClickUserIcon);
                break;

              case "mouseOverEventIcon":
                map.setPaintProperty("event_icon", "circle-opacity", 1);
                map.setPaintProperty("user_icon", "circle-opacity", 0);
                map.setPaintProperty("microblog_icon", "circle-opacity", 0);
                break;

              case "mouseLeaveEventIcon":
                map.setPaintProperty("event_icon", "circle-opacity", 0);

                if (params.clickedIcon === "user") {
                  map.setPaintProperty("user_icon", "circle-opacity", 1);
                  map.setPaintProperty("microblog_icon", "circle-opacity", 0);
                } else {
                  map.setPaintProperty("microblog_icon", "circle-opacity", 1);
                  map.setPaintProperty("user_icon", "circle-opacity", 0);
                }

                break;

              case "mouseClickEventIcon":
                map.on("mouseenter", "event_icon", mouseEnterEventIcon);
                map.on("click", "event_icon", mouseClickEventIcon);
                map.off("mouseenter", "user_icon", mouseEnterUserIcon);
                map.off("click", "user_icon", mouseClickUserIcon);
                map.off("mouseenter", "microblog_icon", mouseEnterMicroblogIcon);
                map.off("click", "microblog_icon", clickMicroblogIcon);
                break;
            }
          });
        });

        // !!! CREATE USERS POPUP !!!

        // Create a popup, but don't add it to the map yet.
        var userIconPopup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
        });

        // function which gets added to the function for the
        // mouseenter listener on the user_icon
        function mouseEnterUserIcon(e) {
          // Change the cursor style as a UI indicator.
          map.getCanvas().style.cursor = "pointer";

          // get the coordinates and description of the user_icon
          var coordinates = e.features[0].geometry.coordinates.slice();
          var description = e.features[0].properties.description;

          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          // Populate the popup and set its coordinates
          // based on the feature found.
          userIconPopup.setLngLat(coordinates).setHTML(description).addTo(map);
        }

        // when mouse scrolls over user_icon
        map.on("mouseenter", "user_icon", mouseEnterUserIcon);

        // when mouse leaves the user_icon change pointer
        // back and remove popup
        map.on("mouseleave", "user_icon", function () {
          map.getCanvas().style.cursor = "";
          userIconPopup.remove();
        });

        function mouseClickUserIcon(e) {
          $state.go("profile", {
            USER_ID: e.features[0].properties.user_id,
          });
        }

        // when a user_icon is clicked go to profile page
        map.on("click", "user_icon", mouseClickUserIcon);

        // !!! CREATE MICROBLOG POPUP !!!

        // Create a popup, but don't add it to the map yet.
        var microblogIconPopup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
        });

        // function which gets added to the function for the
        // mouseenter listener on the microblog_icons
        function mouseEnterMicroblogIcon(e) {
          // Change the cursor style as a UI indicator.
          map.getCanvas().style.cursor = "pointer";

          // get the coordinates and description of the microblog_icon
          var coordinates = e.features[0].geometry.coordinates.slice();
          var description = e.features[0].properties.description;

          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          // Populate the popup and set its coordinates
          // based on the feature found.
          microblogIconPopup.setLngLat(coordinates).setHTML(description).addTo(map);
        }

        // when mouse leaves the microblog_icon change pointer
        // back and remove popup
        map.on("mouseleave", "microblog_icon", function () {
          map.getCanvas().style.cursor = "";
          microblogIconPopup.remove();
        });

        // function which gets added to the function for the
        // click listener on the microblog_icons
        function clickMicroblogIcon(e) {
          var room = e.features[0].properties.room;
          var microblog = null;
          for (var i = 0; i < microblogs.length; i++) {
            if (room === microblogs[i].room) {
              microblog = microblogs[i];
            }
          }

          MicroblogService.getMicroblog(microblog.room).then(
            function (microblog) {
              var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: "microblog.html",
                controller: "MicroblogController",
                resolve: {
                  microblogToOpen: function () {
                    return microblog;
                  },
                },
              });
              modalInstance.result.then(function (data) {});
            },
            function (err) {},
          );
        }

        // !!! CREATE EVENT POPUP !!!

        // Create a popup, but don't add it to the map yet.
        var userEventPopup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
        });

        // function which gets added to the function for the
        // mouseenter listener on the event_icon
        function mouseEnterEventIcon(e) {
          // Change the cursor style as a UI indicator.
          map.getCanvas().style.cursor = "pointer";

          // get the coordinates and description of the event_icon
          var coordinates = e.features[0].geometry.coordinates.slice();
          var description = e.features[0].properties.description;

          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          // Populate the popup and set its coordinates
          // based on the feature found.
          userEventPopup.setLngLat(coordinates).setHTML(description).addTo(map);
        }

        // when mouse leaves the event_icon change pointer
        // back and remove popup
        map.on("mouseleave", "event_icon", function () {
          map.getCanvas().style.cursor = "";
          userEventPopup.remove();
        });

        function mouseClickEventIcon(e) {
          $state.go("event", {
            eventId: e.features[0].properties.id,
          });
        }
      };
    },
  ]);
})();
