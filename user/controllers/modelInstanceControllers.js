'use strict'

ibouge.controller('ChangeProfilePicController', ['$scope', '$uibModalInstance', 'UserService', 'user', function($scope, $uibModalInstance, UserService, user) {
	console.log('ctrl');

	$scope.profilePicFile = {};
	$scope.originalImage = '';
	$scope.croppedImage = '';
	$scope.convertedImage = '';
	$scope.type = null;

	$scope.handleFileSelect = function(evt) {

		// assign picture file to $scope.profilePicFile
		$scope.profilePicFile = evt.currentTarget.files[0];

		// create temporary link to picture and apply immediately
		$scope.$apply(function($scope) {
			$scope.originalImage = URL.createObjectURL($scope.profilePicFile);
		});
	};

	// when user has chosen a picture for their profile and they click orange 'upload' button after cropping it
	$scope.upload = async function() {

		if ($scope.croppedImage === '') {
			return;
		}

		// this will convert url back to a file we can send to the server
        function dataURItoBlob(dataURI) {
            var binary = atob(dataURI.split(',')[1]);
            var array = [];
            for(var i = 0; i < binary.length; i++) {
                array.push(binary.charCodeAt(i));
            }
            return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
        }
		
		// draw cropped image to a canvas
		var canvas = document.getElementById('ibg-image-to-canvas');
		var context = canvas.getContext('2d');
		var img = document.getElementById('ibg-cropped-image');
		context.drawImage(img, 0, 0, 264, 264);

                // convert canvas to image
                $scope.convertedImage = canvas.toDataURL("image/jpeg");
                var blobData = dataURItoBlob($scope.convertedImage);

                let originalImageBlob = await fetch($scope.originalImage).then(r => r.blob());
            
		// this is the info we will be sending to the userService
		var reqData = {
		        userId: user._id,
                        file: blobData,
                        originalFile: originalImageBlob,
                        albumName: 'all-profile-pictures'
		};

		UserService.changeProfilePic(user.email, reqData).then(function(response) {
			$uibModalInstance.close({url: response});
		}, function(response) {
			// console.log(response);
		});
	};

	$scope.cancel = function () {
		$uibModalInstance.dismiss();
	};
}]);
