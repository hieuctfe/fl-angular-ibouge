(function () {
    'use strict';

    ibouge.directive('countryModal', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            scope: {},
            link: function (scope, element) {
                scope.map = null;

                scope.init = function () {

                    var key = sessionStorage.countryISOKey;
                    var mapPath = 'https://code.highcharts.com/mapdata/countries/' + key + '/' + key + '-all.js';
                    var mapPathAgain  = 'countries/' + key + '/' + key + '-all';


                    $.getScript(mapPath, function () {

                        var data = Highcharts.geojson(Highcharts.maps[mapPathAgain]);

                        data.forEach(function(i) {
                            i.drilldown = i.properties['hc-key'];
                            i.value = i
                        });

                        Highcharts.mapChart(element[0], {

                            credits: {
                                enabled: false
                            },

                            plotOptions: {
                                map: {
                                    states: {
                                        hover: {
                                            color: '#FF8E69'
                                        }
                                    },

                                    color: '#FAB88E',
                                    showInLegend: false
                                },

                                series: {
                                    events: {
                                        click: function (event) {
                                            sessionStorage.stateName = event.point.name;
                                            sessionStorage.longitude = event.point.properties.longitude;
                                            sessionStorage.latitude = event.point.properties.latitude;
                                            $rootScope.$broadcast('closeModal');
                                        }
                                    }
                                }
                            },
                            chart: {
                                backgroundColor: null
                            },

                            tooltip: {
                                backgroundColor: '#F7F8FA',
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: '#FF8E69',
                                formatter: function () {
                                    return this.point.name
                                }
                            },

                            title: {
                                text: null
                            },

                            series: [{
                                data: data,
                                dataLabels: {
                                    enabled: false
                                },
                                borderColor: 'white'
                            }]
                        });
                    });
                };

                scope.init();
            }
        }
    }]);

})();
