(function () {
  "use strict";

  "use strict";

  ibouge.directive("profileSetupMapDirective", [
    "$rootScope",
    "$state",
    "ProfileSetupMapService",
    function ($rootScope, $state, ProfileSetupMapService) {
      return {
        restrict: "A",
        scope: {
          onInitMap: "&",
        },
        link: function (scope, element, attrs) {
          scope.init = function () {
            ProfileSetupMapService.loadProfileSetupMap(element[0], {});
            // var data = Highcharts.geojson(Highcharts.maps['custom/world']);

            // data.forEach(function(i) {
            //     i.drilldown = i.properties['hc-key'];
            //     i.value = i
            // });

            // // Instantiate the map
            // Highcharts.mapChart(element[0], {

            //     credits: {
            //         enabled: false
            //     },

            //     tooltip: {
            //         borderColor: '#acadb3',
            //         backgroundColor: '#F7F8FA',
            //         borderRadius: 20,
            //         borderWidth: 1,
            //         formatter: function () {
            //             return this.point.name
            //         }
            //     },
            //     title: {
            //         text: null
            //     },
            //     plotOptions: {
            //         series: {
            //             events: {
            //                 click: function (event) {
            //                     sessionStorage.profileSetupCountryName = event.point.name;
            //                     sessionStorage.profileSetupCountryISOKey = event.point.drilldown;

            //                     var key = sessionStorage.profileSetupCountryISOKey;
            //                     var mapPath = 'https://code.highcharts.com/mapdata/countries/' + key + '/' + key + '-all.js';
            //                     var mapPathAgain  = 'countries/' + key + '/' + key + '-all';

            //                     $.getScript(mapPath, function () {

            //                         var data = Highcharts.geojson(Highcharts.maps[mapPathAgain]);

            //                         data.forEach(function(i) {
            //                             i.drilldown = i.properties['hc-key'];
            //                             i.value = i
            //                         });

            //                         Highcharts.mapChart(element[0], {

            //                             credits: {
            //                                 enabled: false
            //                             },

            //                             plotOptions: {
            //                                 map: {
            //                                     states: {
            //                                         hover: {
            //                                             color: '#FF8E69'
            //                                         }
            //                                     },

            //                                     color: '#FAB88E',
            //                                     showInLegend: false
            //                                 },

            //                                 series: {
            //                                     events: {
            //                                         click: function (event) {
            //                                             sessionStorage.profileSetupStateName = event.point.name;
            //                                             sessionStorage.profileSetupLongitude = event.point.properties.longitude;
            //                                             sessionStorage.profileSetupLatitude = event.point.properties.latitude;

            //                                             // clear the highmaps drilldown map off the element
            //                                             element.empty();

            //                                             // send the element to the service to be created
            //                                             // and attached to the element
            //                                             ProfileSetupMapService.loadProfileSetupMap(element[0], {
            //                                                 profileSetupStateName: sessionStorage.profileSetupStateName,
            //                                                 profileSetupLongitude: sessionStorage.profileSetupLongitude,
            //                                                 profileSetupLatitude: sessionStorage.profileSetupLatitude
            //                                             });
            //                                         }
            //                                     }
            //                                 }
            //                             },
            //                             chart: {
            //                                 backgroundColor: null
            //                             },

            //                             tooltip: {
            //                                 backgroundColor: '#F7F8FA',
            //                                 borderRadius: 20,
            //                                 borderWidth: 1,
            //                                 borderColor: '#FF8E69',
            //                                 formatter: function () {
            //                                     return this.point.name
            //                                 }
            //                             },

            //                             title: {
            //                                 text: null
            //                             },

            //                             series: [{
            //                                 data: data,
            //                                 dataLabels: {
            //                                     enabled: false
            //                                 },
            //                                 borderColor: 'white'
            //                             }]
            //                         });

            //                         // changes the message above the map to appropriate text
            //                         $rootScope.profileSetupMapFunction(2);

            //                     });
            //                 }
            //             }
            //         },
            //         map: {
            //             states: {
            //                 hover: {
            //                     color: '#acadb3'
            //                 }
            //             },

            //             color: '#DFE0E6',
            //             showInLegend: false
            //         }
            //     },

            // series: [{
            //         data: data,
            //         dataLabels: {
            //             enabled: false
            //         }
            //     }]

            // });
          };

          scope.init();
        },
      };
    },
  ]);
})();
