(function () {
  "use strict";

  ibouge.service("MicroblogMapService", [
    "$rootScope",
    "$http",
    function ($rootScope, $http) {
      // this.getLocationAPI();
      // address of the location clicked or searched
      var locationName;
      // coordinates of the location clicked or searched
      var coordinates = [];

      mapboxgl.accessToken = "pk.eyJ1IjoiaWJvdWdlIiwiYSI6ImNqY2wzaXJ5YTAycWIzM2pyb3JhN20yenkifQ.jhimhHWkb-6GD3Tq8bvCKA";

      // function to create the map for the creating a microblog screen
      this.createMap = function (element) {
        var map = new mapboxgl.Map({
          container: element,
          style: "https://api.maptiler.com/maps/positron/style.json?key=RGierAHokphISswP6JTB",
          center: [0, 0], // starting position
          zoom: 9,
          minZoom: 9,
          maxZoom: 18,
        });

        // create geocoder
        var geocoder = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
        });

        // add the geocoder to the #geocoder div on right side of modal
        document.getElementById("geocoder").appendChild(geocoder.onAdd(map));

        // add navigation control to the map
        map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

        // user location
        var geolocate = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: false,
          },
          trackUserLocation: true,
        });
        // Add the control to the map.
        map.addControl(geolocate);
        //disable drag
        map.dragPan.disable();
        // after the map loads do...
        map.on("load", function () {
          // resize the map, this is done because the map is rendered before the modal is
          // this causes the map to load incompletely and look funny
          map.resize();

          // trigger user location
          geolocate.trigger();

          // ensures the mouse is a pointer which tells client to click
          map.getCanvas().style.cursor = "pointer";

          // GeoJSON source for pink dot which is for microblog
          map.addSource("single-point", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [],
            },
          });
          // if (navigator.geolocation) {
          //   var location_timeout = setTimeout("geolocFail()", 10000);
          //   navigator.geolocation.getCurrentPosition(
          //     function (position) {
          //       clearTimeout(location_timeout);

          //       var lat = position.coords.latitude;
          //       var lng = position.coords.longitude;
          //       console.log(lat, lng);
          //       // get the bounding box of the users current orange circle coordinates
          //       var bbox = new mapboxgl.LngLat(lat, lng);
          //     },
          //     function (error) {
          //       clearTimeout(location_timeout);
          //       geolocFail();
          //     },
          //   );
          // }
          // at the layer for the pink dot for microblogging
          map.addLayer({
            id: "point",
            source: "single-point",
            type: "circle",
            paint: {
              "circle-radius": 20,
              // "circle-color": $rootScope.iconColor,
              "circle-color": "#329CEC",
            },
          });

          // when the map is clicked do...
          map.on("click", function (event) {
            // get the lng and lat of where the mouse clicked
            var lng = event.lngLat.lng;
            var lat = event.lngLat.lat;

            coordinates = [lng, lat];

            // geometry for where the microblogging pink dot goes in the map
            var geometry = {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [lng, lat],
              },
            };

            // URL necessary in order to the reverse geocoding
            var reverseGeocodingURL =
              "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
              lng +
              "," +
              lat +
              ".json?access_token=pk.eyJ1IjoiaWJvdWdlIiwiYSI6ImNqY2wzaXJ5YTAycWIzM2pyb3JhN20yenkifQ.jhimhHWkb-6GD3Tq8bvCKA";

            // request the reverse geoding response through the mapbox
            // geocoding api
            $http.get(reverseGeocodingURL).then(function (response) {
              // put the responses "place_name" in variable
              locationName = response.data.features[0].place_name;

              // set the input inside the geocoding search input to the
              // address of where the mouse was clicked on the map
              geocoder.setInput(locationName === "undefined" ? lat + ", " + lng : locationName);
            });

            // get the pink dot and place it on the map
            map.getSource("single-point").setData(geometry);
          });

          // Once the geocoder's result is chosen
          // place a pink microblogging dot on the screen
          geocoder.on("result", function (event) {
            map.getSource("single-point").setData(event.result.geometry);
            coordinates = event.result.center;
          });
        });
      };

      // function that returns the locations coordinates
      // so they can be placed on the map
      this.getCoordinates = function () {
        return coordinates;
      };
    },
  ]);
})();
