'use strict';
//auth controller

ibouge.controller("AuthController", function ($scope, $http, $rootScope, $location, $cookies, UserService, UtilService, state, options) {
    $scope.user = {email: '', password: '', confirmPassword: ''};
    $scope.message = "";
	$scope.rememberMe = undefined;
	$scope.gender = {
		selected: null,
		items: UtilService.gender
	};
	$scope.dob = {
		mm: {
			selected: null,
			months: UtilService.dob.mm
		},
		dd: {
			selected: null,
			days: UtilService.dob.dd
		},
		yyyy: {
			selected: null,
			years: UtilService.dob.yyyy
		}
	};

	$scope.header = '';
    $scope.errorMessage = null;
	$scope.successMessage = null;
	$scope.resend = false;
	$scope.error = null;
	$scope.hideIncompleteMessage = false;

	$scope.init = function() {
		if (state === 'login') {
			$scope.header = options.header;
			if(options.success) {
				$scope.showSuccess(options.success);
			} else if (options.resend){
				$scope.showResend();
			} else {
				$scope.showError(options.err);
			}
		}
	};

	$scope.showError = function(msg) {
		if (msg === 'Please check your email to validate your address.') {
            $scope.errorMessage = msg;
            $scope.resend = true;
            $scope.hideIncompleteMessage = true;
		} else {
            $scope.errorMessage = msg;
            $scope.successMessage = null;
            $scope.resend = false;
            $scope.hideIncompleteMessage = true;
		}

	};

	$scope.showErrorIncompleteRegisterForm = function (msg) {
        $scope.error = msg;
    };

	$scope.showSuccess = function(msg) {
		$scope.errorMessage = null;
		$scope.successMessage = msg;
		$scope.resend = false;
		$scope.hideIncompleteMessage = true;
	};

	$scope.showResend = function() {
		$scope.resend = true;
		$scope.successMessage = null;
		$scope.errorMessage = null;
	};
    //login call to webapi (node implemented service)

    $scope.login = function(){
		var reqData = {
			username: $scope.user.email,
			password: $scope.user.password,
			remember_me: $scope.rememberMe
		};
        $http.post('/auth/login', reqData).then(function(response) {
			var data = response.data;
			if (data.state === 'success') {
				$rootScope.authenticated = true;
				$rootScope.current_user = data.user.email;
				$rootScope.sess = data.user;
				sessionStorage.setItem('current_user', $rootScope.sess.email);
				$location.path('/');
			} else if (data.resend) {
				$scope.showResend(data.message);
				$rootScope.sess = null;
			} else {
				$scope.showError(data.message);
				$rootScope.sess = null;
			}
        });
    };

    //login call to webapi (node implemented service)
    $scope.register = function(isValid){
	if(isValid) {
        // set gender
        if ($scope.gender.selected) {
            $scope.user.gender = $scope.gender.selected.id;
        }

        // set DOB
        if ($scope.dob.mm.selected && $scope.dob.dd.selected && $scope.dob.yyyy.selected) {
            $scope.user.dob = $scope.dob.yyyy.selected + '-' + $scope.dob.mm.selected.id + '-' + $scope.dob.dd.selected;
        }

        // this is required
        $scope.user.username = $scope.user.email;
        console.log($scope.user);

        $http.post('/auth/signup', $scope.user).then(function (response) {
            var data = response.data;
            if (data.state === 'success') {
                $scope.showSuccess(data.message);
            } else {
                $scope.showError(data.message);
            }
        });
    } else {
	    $scope.showErrorIncompleteRegisterForm('Please fill in all fields. Thank you!');


    }
    };

	$scope.resendEmail = function() {
		$http.post('/auth/resend-email', {email: $scope.user.email}).then(function(response) {
			if(response.data.state === 'success'){
				console.log('sent');
			} else {
				console.log('sent failed');
			}
        });
	};

	$scope.restorePassword = function(restoreEmail) {
		$http.post('/auth/restore-password', {email: restoreEmail}).then(function(response) {
			if(response.data.state === 'success'){
				$scope.showSuccess(response.data.message);
			} else {
				console.log($scope.showError(response.data.message));
			}
        });
	};

	$scope.createNewPassword = function() {
		var reqData = {
			email: $scope.user.email,
			password: $scope.user.password,
			token: options.token
		};
		$http.post('/auth/new-password', reqData).then(function(response) {
			if(response.data.state === 'success'){
				$scope.showSuccess(response.data.message);
                                setTimeout(function() {
                                        $scope.login();
                                }, 2000);
			} else {
				$scope.showError(response.data.message);
			}
        });
	};

	$scope.toggleRememberMe = function(isChecked) {
		var date = new Date();
		$scope.rememberMe = undefined;
		var expires = new Date(date);
		if (isChecked) {
			$scope.rememberMe = date.getTime().toString();
			expires.setMonth(expires.getMonth() + 1);
		} else {
			expires.setFullYear(1970);
		}
		$cookies.put('remember_me', $scope.rememberMe, {expires: expires});
	};
	$scope.init();


});
