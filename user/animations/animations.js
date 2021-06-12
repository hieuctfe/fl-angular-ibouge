(function () {
    'use strict';

    // ngAnimate animation classes
    ibouge.animation('.fadeOut', [function () {
        return {

            leave: function (element, doneFn) {
                jQuery(element).fadeOut(500, doneFn);
            }
        }
    }]);

})();