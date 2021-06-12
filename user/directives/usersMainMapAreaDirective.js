(function () {
  "use strict";

  ibouge.directive("usersMainMapArea", [
    "$rootScope",
    "$state",
    "MicroblogService",
    "UserService",
    "AddMicroblogsService",
    "AddUsersToMapService",
    "$uibModal",
    "EventService",
    "AddEventsService",
    function (
      $rootScope,
      $state,
      MicroblogService,
      UserService,
      AddMicroblogsService,
      AddUsersToMapService,
      $uibModal,
      EventService,
      AddEventsService,
    ) {
      return {
        restrict: "A",
        link: function (scope, element) {
          var firstMapMoveEnd = 0;

          UserService.getUser($rootScope.sess._id).then(function (data) {
            UserService.getAllUsers().then(function (users) {
              MicroblogService.getAllMicroblogs().then(function (microblogs) {
                EventService.getAllEvents().then(function (events) {
                  // get the current users bounding box
                  // var bbox = new mapboxgl.LngLatBounds(data.data.location.cityToFollow.bbox.sw, data.data.location.cityToFollow.bbox.ne);
                  //   var bbox = new mapboxgl.LngLatBounds(
                  //     data.data.location.coordinates[0],
                  //     data.data.location.coordinates[1],
                  //   );

                  // instantiate new map
                  var map = new mapboxgl.Map({
                    container: element[0],
                    style: "https://api.maptiler.com/maps/positron/style.json?key=RGierAHokphISswP6JTB",
                    center: data.data.location.coordinates,
                    zoom: 9,
                  });

                  // fit the new map to the users selected bounds
                  //   map.fitBounds(bbox, {
                  //     linear: true,
                  //   });

                  // create a geoLocator to give users their location at their request
                  var geoLocator = new mapboxgl.GeolocateControl({
                    positionOptions: {
                      enableHighAccuracy: true,
                    },
                    trackUserLocation: true,
                  });

                  // ibouge mapbox.com access token
                  mapboxgl.accessToken =
                    "pk.eyJ1IjoiaWJvdWdlIiwiYSI6ImNqY2wzaXJ5YTAycWIzM2pyb3JhN20yenkifQ.jhimhHWkb-6GD3Tq8bvCKA";

                  // add geocoder for users to search the map
                  var geoCoder = new MapboxGeocoder({
                    accessToken: mapboxgl.accessToken,
                  });

                  // add geocoder to the map
                  map.addControl(geoCoder);

                  // add the geoLocator to the bottom right of the map screen
                  map.addControl(geoLocator, "bottom-right");

                  // adds navigation control for zooming
                  map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

                  // if data has changed try loading new sources
                  var loadNewSource = function () {
                    // if the new style or data is loaded
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
                    firstMapMoveEnd++;

                    // ensures function doesn't get used until the user moves
                    // the map for the first time
                    if (firstMapMoveEnd > 1) {
                      AddMicroblogsService.mapMoveEventChangeIcons(map, microblogs);
                      AddUsersToMapService.mapMoveEventChangeIcons(map, users);
                      AddEventsService.mapMoveEventChangeIcons(map, events);
                    }
                  });

                  // when user has mouse event with the main microblog
                  // and user icons in the top left of the map
                  // makes icons appear and disappear but changing the
                  // icons circle-opacity to 0 and 1 respectively
                  $rootScope.$on("mapIconEvent", function (event, params) {
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
                });
              });
            });
          });
        },
      };
    },
  ]);
})();
