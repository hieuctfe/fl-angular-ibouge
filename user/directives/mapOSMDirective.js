(function () {
  "use strict";

  ibouge.directive("mapOsm", [
    "$rootScope",
    "$state",
    "MapOSMService",
    "MicroblogService",
    "UserService",
    "EventService",
    function ($rootScope, $state, MapOSMService, MicroblogService, UserService, EventService) {
      return {
        restrict: "A",
        link: function (scope, element, attrs) {
          UserService.getAllUsers($rootScope.sess._id).then(function (users) {
            // Get all of the Microblog data from the database
            MicroblogService.getAllMicroblogs().then(function (microblogs) {
              // get all of the user data from the database
              EventService.getAllEvents().then(function (events) {
                // After microblog data is received load the OSM map
                // and send the map all necessary data
                MapOSMService.loadOSMMap(element[0], {
                  stateName: sessionStorage.stateName,
                  longitude: sessionStorage.longitude,
                  latitude: sessionStorage.latitude,
                  allMicroblogs: microblogs,
                  allUsers: users,
                  allEvents: events,
                });
              });
            });
          });
        },
      };
    },
  ]);
})();
