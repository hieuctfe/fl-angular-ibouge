(function () {
    'use strict';

    ibouge.directive('microblogMap', ['$rootScope', '$state', 'MicroblogMapService', function($rootScope, $state, MicroblogMapService) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {

                scope.init = function () {

                    // Send the element to the MicroblogMapService to
                    // create the map and place it on the element
                    MicroblogMapService.createMap(element[0])
                };

                scope.init();
            }
        }
    }]);
})();
