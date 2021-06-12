"use strict";

ibouge.directive("highMapsMap", [
  "$rootScope",
  "UserService",
  "$state",
  "$http",
  "$uibModal",
  "$document",
  function ($rootScope, UserService, $state, $http, $uibModal, $document) {
    return {
      restrict: "A",
      scope: {
        onInitMap: "&",
      },
      link: function (scope, element, attrs) {
        scope.currentView = "people";
        scope.isInitialized = false;
        scope.people = [];
        scope.duplicates = [];
        scope.iconBase = "img/";
        scope.icons = {
          people: { icon: scope.iconBase + "blue_dot_icon.png" },
        };
        scope.map = null;
        scope.countryMap = null;

        scope.init = function () {
          var data = Highcharts.geojson(Highcharts.maps["custom/world"]);

          data.forEach(function (i) {
            i.drilldown = i.properties["hc-key"];
            i.value = i;
          });

          // Instantiate the map
          Highcharts.mapChart(element[0], {
            credits: {
              enabled: false,
            },

            tooltip: {
              borderColor: "#acadb3",
              backgroundColor: "#F7F8FA",
              borderRadius: 20,
              borderWidth: 1,
              formatter: function () {
                return this.point.name;
              },
            },
            title: {
              text: null,
            },
            plotOptions: {
              series: {
                events: {
                  click: function (event) {
                    sessionStorage.countryName = event.point.name;
                    sessionStorage.countryISOKey = event.point.drilldown;

                    var countryModal = $uibModal.open({
                      appendTo: element,
                      animation: false,
                      templateUrl: "countryModal.html",
                      size: "lg",
                    });

                    scope.$on("closeModal", function (eventTwo) {
                      countryModal.close();
                      element.empty();

                      $state.go("mapOSM");
                    });
                  },
                },
              },
              map: {
                states: {
                  hover: {
                    color: "#acadb3",
                  },
                },

                color: "#DFE0E6",
                showInLegend: false,
              },
            },

            series: [
              {
                data: data,
                dataLabels: {
                  enabled: false,
                },
              },
            ],
          });
        };

        scope.init();
      },
    };
  },
]);
