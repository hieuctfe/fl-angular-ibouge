(function () {
  "use strict";

  ibouge.service("AddUsersToMapService", [
    "$state",
    "$rootScope",
    "UserService",
    function ($state, $rootScope, UserService) {
      var uniqueUsers;
      var currentUsersOnMap = [];

      this.addUsersToMap = function (map, users) {
        // array to hold Users GeoJSON info
        var arrayOfGeoJSON = [];

        // function to take interest out of an array
        // and make them conducive for the view
        function getInterests(arr) {
          if (!arr || arr.length === 0) {
            return "";
          }

          var interests = "";
          for (var i = 0; i < arr.length; i++) {
            if (i === arr.length - 1) {
              interests += arr[i];
            } else {
              interests += arr[i] + ", ";
            }
          }

          return interests.trim();
        }

        // calculates and returns users age
        function getAge(user) {
          if (user.dob) {
            return Math.floor((new Date() - new Date(user.dob)) / 31536000000);
          }
          return "";
        }

        // Iterate through all users and create new GeoJSON
        // based off the lng / lat coordinates
        for (var position in users) {
          var coordinates = users[position].location.coordinates;
          var genderAbbrev = UserService.getGenderAbbrev(users[position].gender);
          var onlineImage = users[position].is_online ? "img/contact-online.png" : "img/contact-idle.png";
          var onlineImageBorder = users[position].is_online ? " #40ff00" : "#FFBA52";
          if (users[position].profile_pic) {
            // geometry for where the users blue dot goes in the map
            var geometry = {
              type: "Feature",
              properties: {
                description:
                  '<div>\
				 	<div style="display: flex;">\
				 		<img style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; margin-top: 5px; border: 4px solid' +
                  onlineImageBorder +
                  ';" src="' +
                  users[position].profile_pic +
                  '">\
				 		<div style="font-weight: 400; color: #8e8e8e;">\
				 			<div style="font-weight: bold; margin-top: 5px">' +
                  users[position].fname +
                  " " +
                  users[position].lname +
                  '</div>\
				 			<div><span style="color: #1E90FF;">' +
                  genderAbbrev +
                  " " +
                  getAge(users[position]) +
                  "</span>" +
                  " " +
                  "- " +
                  getInterests(users[position].profile.interests) +
                  '</div>\
				 		</div>\
				 		<div style="display: flex; margin-left: 12px; padding-left: 5px; border-left: 2px solid #DDD;"><i class="fa fa-chevron-right" aria-hidden="true" style="margin: auto;"></i></div>\
				 	</div>\
				 </div>',
                user_id: users[position]._id,
              },
              geometry: {
                type: "Point",
                coordinates: coordinates,
              },
            };
          } else {
            // geometry for where the users blue dot goes in the map
            var geometry = {
              type: "Feature",
              properties: {
                description:
                  '<div>\
				 	<div style="display: flex;">\
				 		<img style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; margin-top: 5px; border: 4px solid' +
                  onlineImageBorder +
                  ';" src="' +
                  "img/upload-photo.png" +
                  '">\
				 		<div style="font-weight: 400; color: #8e8e8e;">\
				 			<div style="font-weight: bold; margin-top: 5px">' +
                  users[position].fname +
                  " " +
                  users[position].lname +
                  '</div>\
				 			<div><span style="color: #1E90FF;">' +
                  genderAbbrev +
                  " " +
                  getAge(users[position]) +
                  "</span>" +
                  " " +
                  "- " +
                  getInterests(users[position].profile.interests) +
                  '</div>\
				 		</div>\
				 		<div style="display: flex; margin-left: 12px; padding-left: 5px; border-left: 2px solid #DDD;"><i class="fa fa-chevron-right" aria-hidden="true" style="margin: auto;"></i></div>\
				 	</div>\
				 </div>',
                user_id: users[position]._id,
              },
              geometry: {
                type: "Point",
                coordinates: coordinates,
              },
            };
          }

          // push the new geometry onto array holding
          // GeoJSON for users
          arrayOfGeoJSON.push(geometry);
        }

        // Add new source containing GeoJSON info for users
        map.addSource("usersIcons", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: arrayOfGeoJSON,
          },
        });

        // Add styling for GeoJSON user icons
        map.addLayer({
          id: "user_icon",
          source: "usersIcons",
          type: "circle",
          paint: {
            "circle-radius": 6,
            "circle-color": "#329CEC",
            "circle-opacity": 1,
          },
        });
      };

      // Because features come from tiled vector data, feature geometries may be split
      // or duplicated across tile boundaries and, as a result, features may appear
      // multiple times in query results. This fixes that and filters out only unique
      // user_icons
      function getUniqueIcons(users) {
        var existingFeatureKeys = {};

        var uniqueFeatures = users.filter(function (el) {
          if (existingFeatureKeys[el.properties.user_id]) {
            return false;
          } else {
            existingFeatureKeys[el.properties.user_id] = true;
            return true;
          }
        });

        return uniqueFeatures;
      }

      // map has been moved, check and change current icons
      // in the right side list
      this.mapMoveEventChangeIcons = function (map, users) {
        // Get only the user icons currently on the map
        var usersOnMap = map.queryRenderedFeatures({
          layers: ["user_icon"],
        });

        // if there are users on the map
        if (usersOnMap) {
          // sometimes features on the map are doubled
          // this makes sure only 1 icon per feature
          // placed on the map
          uniqueUsers = getUniqueIcons(usersOnMap);

          // var to hold final users
          var finalUsers = [];

          // iterate through unique users and place the data
          // from the actual user into finalUsers variable
          for (var i = 0; i < uniqueUsers.length; i++) {
            for (var j = 0; j < users.length; j++) {
              if (uniqueUsers[i].properties.user_id === users[j]._id) {
                finalUsers.push(users[j]);
                break;
              }
            }
          }

          currentUsersOnMap = finalUsers;

          // $broadcast to usersMainMapAreaController the final users
          // to be placed in the right hand side list of users
          // as well as the total number of registered users in
          // iBouge's database
          $rootScope.$broadcast("currentUsers", {
            currentUsers: currentUsersOnMap,
            totalIbougeUsers: users.length,
          });

          // this will return the finalUsers in the map. This was not here before, hence it wasn't sending
          // usersOnMap back to dashboardMapService.js line 124.
          return finalUsers;
        }
      };
    },
  ]);
})();
