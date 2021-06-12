'use strict'

ibouge.directive("ibgReadFile",function(){

	return {
		restrict: 'A',
		link: function($scope,el){
			el.bind("change", function(e){
				$scope.handleFileSelect(e);
			});
		}
	}
});

ibouge.directive("ibgImageFileReader",function(){

    return {
        restrict: 'A',
        link: function($scope,el){
            el.bind("change", function(e){
                $scope.handleImageFileSelect(e);
            });
        }
    }
});

ibouge.directive('ngConfirmClick', [
    function(){
        return {
            link: function (scope, element, attr) {
                var msg = attr.ngConfirmClick || "Are you sure?";
                var clickAction = attr.confirmedClick;
                element.bind('click',function (event) {
                    if ( window.confirm(msg) ) {
                        scope.$eval(clickAction)
                    }
                });
            }
        };
}])

ibouge.directive('ibgScroller', ['$timeout', function($timeout) {
	return {
		restrict: 'A',
/*                scope: {
                        ibgScroller: "="
                }, */
		link: function(scope, element, attrs) {
			scope.isReachedEnd = false;
			scope._room = attrs.ibgScroller;
			var timer = 0;
                        scope.$watchCollection('ibgScroller', function (newValue) {
                                if (newValue || 1)
                                {
                                        $timeout(function() {
                                                $(element).scrollTop($(element)[0].scrollHeight);
                                        }, 300);
                                }
                        });
			element.bind('scroll', function(event) {
				$timeout.cancel(timer);
				timer = $timeout(function() {
					var elm = element[0];
					if (elm.scrollTop + elm.clientHeight >= elm.scrollHeight) {
						scope.isReachedEnd = true;
					} else {
						scope.isReachedEnd = false;
					}

					if (elm.scrollTop < 2) {
						scope.loadMore(scope._room);
					}
				}, 300);

			});

			scope.$on('scroll-to-bottom-' + scope._room, function() {
				scope._scrollToBottom(element[0]);
			});

			scope.$on('check-and-scroll-to-bottom-' + scope._room, function() {
                                // Always scroll to bottom upon receiving new message
//				if (scope.isReachedEnd) {
					scope._scrollToBottom(element[0]);
//				}
			});

			scope._scrollToBottom = function(elm) {
				$timeout(function() {
					elm.scrollTop = elm.scrollHeight;
				});
			}
		}
	}
}]);

ibouge.directive('ibgMainSearchResults', [function() {
	return {
		restrict: 'E',
		templateUrl: 'ibg-main-search-results.html',
		link: function(scope, element, attrs) {
			scope.showResults = false;

			scope.$watch('search.results', function(results) {
				if (results && results.length > 0) {
					scope.showResults = true;
				} else {
					scope.showResults = false;
				}
			});

            scope.$hide = function () {
                scope.showResults = false;
            };

            scope.clear = function () {
                document.getElementById('searchText').value = '';
            };
		}
	}
}]);

ibouge.directive('clickOutside', ['$document', '$parse', function($document, $parse) {
	return {
		restrict: 'A',
		link: function (scope, element, attr) {
			var clickOutsideFunction = $parse(attr['clickOutside']);
			var documentClickHandler = function (event) {
				var eventOutsideTarget = (element[0] !== event.target) && (0 === element.find(event.target).length);
				if (eventOutsideTarget) {
					scope.$apply(function () {
						clickOutsideFunction(scope, {});
                        scope.clear();
                    });
				}
            };

			$document.on("click", documentClickHandler);
			scope.$on("$destroy", function () {
				$document.off("click", documentClickHandler)
			});
		}
	}
}]);

// THIS DIRECTIVE IS USED FOR FRIEND POPUP- IT REMAINS OPEN WHILE BEING HOVERED
ibouge.directive('popoverHoverable', ['$timeout', '$document', function ($timeout, $document) {
    return {
        restrict: 'A',
        scope: {
            popoverHoverable: '=',
            popoverIsOpen: '=',
			friendId: '@'
        },
        link: function(scope, element, attrs) {
            scope.insidePopover = false;

            scope.$watch('insidePopover', function (insidePopover) {
                togglePopover(insidePopover);
            });

            scope.$watch('popoverIsOpen', function (popoverIsOpen) {
                scope.insidePopover = popoverIsOpen;
            });

            function togglePopover (isInsidePopover) {
                $timeout.cancel(togglePopover.$timer);
                togglePopover.$timer = $timeout(function () {
                    if (isInsidePopover) {
                        showPopover();
                    } else {
                        hidePopover();
                    }
                }, 100);
            }

            function showPopover () {
                if (scope.popoverIsOpen) {
                    return;
                }

                $(element[0]).click();
            }

            function hidePopover () {
                scope.popoverIsOpen = false;
                scope.insidePopover = false;
            }

            $(document).bind('mouseover', function (e) {
                var target = e.target;
                if (inside(target)) {
                    scope.insidePopover = true;
                    scope.$digest();
                }
            });

            $(document).bind('mouseout', function (e) {
                var target = e.target;
                if (inside(target)) {
                    scope.insidePopover = false;
                    scope.$digest();
                }
            });

            scope.$on('$destroy', function () {
                $(document).unbind('mouseenter');
                $(document).unbind('mouseout');
            });

            function inside (target) {
                return insideTrigger(target) || insidePopover(target);
            }

            function insideTrigger (target) {
                return element[0].contains(target);
            }

            function insidePopover (target) {
                var isIn = false;
                var popovers = $('#popover' + attrs.friendid);
                for (var i = 0, len = popovers.length; i < len; i++) {
                    if (popovers[i].contains(target)) {
                        isIn = true;
                        break;
                    }
                }
                return isIn;
            }
        }
    };
}]);

//ibgClickOutside directive was here, no longer useful, replaced with uib.
