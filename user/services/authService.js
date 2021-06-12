'use strict'

ibouge.service('AuthService', ['$q', '$timeout', '$http', '$rootScope', '$cookies', '$state', 'UserService', 'SocketFactory', function($q, $timeout, $http, $rootScope, $cookies, $state, UserService, SocketFactory) {

	this._checkLoggedIn = function() {

		// get connection to the opened socket
		var socket = SocketFactory.connection;

		var deferred = $q.defer();

		$timeout(function() {
			// check if already logged in
			if ( $rootScope.sess && angular.isObject($rootScope.sess) ) {	// user already loaded
				deferred.resolve();

			} else { // user not loaded, check session

				$http.get('/auth/me').then(function(response) {
					// session exists (user logged in)
					$rootScope.sess = response.data;
					$rootScope.current_user = $rootScope.sess.email;

                    // add the clients ID to the socket
                    // on the server side when browser is refreshed
                    socket.emit('addUserID', {
                        id: $rootScope.sess._id
                    });

					UserService.updateMyLocation();
					deferred.resolve();
				}, function(response) {
					// user not logged in
					// check for remember me
					var rememberMe = $cookies.get('remember_me');

					if (rememberMe && rememberMe !== '') {
						$http.get('/auth/user?key=' + rememberMe).then( function(response) {
							// load remembered user
							$rootScope.sess = response.data;
							$rootScope.current_user = $rootScope.sess.email;

                            // add the clients ID to the socket
                            // on the server side
                            socket.emit('addUserID', {
                                id: $rootScope.sess._id
                            });

							UserService.updateMyLocation();
							deferred.resolve();
						}, function(response) {
							// load remembered user failed
							deferred.reject();
						});
					} else { // remember me not set
						deferred.reject();
					}
				});
			}
		});
		return deferred.promise;
	};

	this._activateUser = function(token) {
		var deferred = $q.defer();
		$timeout(function() {
			if (!token) {
				deferred.resolve({
					success: '',
					header: 'Welcome! Log in to your account'
				});
			} else {
				$http.post('/auth/activate-account', {token: token}).then(function(response) {
					if (response.data.state === 'success') {
						deferred.resolve({
							success: 'You have successfully confirmed your email',
							header: 'Almost there! Now Log In to your account'
						});
					} else {
						deferred.reject({
							header: 'Almost there! Now Log In to your account',
							err: 'Email verification failed',
							resend: response.data.resend
						});
					}
				}, function() {
					deferred.reject({
						header: 'Almost there! Now Log In to your account',
						err: 'Email verification failed'
					});
				});
			}
		});
		return deferred.promise;
	};

	this._chekcActivated = function() {
		if ( !$rootScope.sess || !angular.isObject($rootScope.sess) ) {
			return false;
		}

		if ($rootScope.sess.activation_status === 3) {
			$rootScope.authenticated = true;
			return true;
		}

		return false;
	};

	this._redirectToActivationStep = function() {

		if ( $rootScope.sess && angular.isObject($rootScope.sess) ) {

			var status = $rootScope.sess.activation_status;

			if (status === 3) {
				$state.go('home');
				return;
			} else if (status === 0 || status === 1 || status === 2) {
				$state.go('profilesetup', {STEP: 'step' + (status + 1)});
				return;
			}
		}

		$state.go('login');
		return;
	};

	this.checkValid = function() {
		var deferred = $q.defer();
		this._checkLoggedIn().then(angular.bind(this, function() {
			if (this._chekcActivated()) {
				deferred.resolve();
			} else {
				this._redirectToActivationStep();
			}
		}), function() {
			$state.go('login');
			return;
		});
		return deferred.promise;
	};

	this.chekcProfileActivationStep = function(step) {
		var deferred = $q.defer();
		this._checkLoggedIn().then(function() {
			deferred.resolve(step);
		}, function() {
			$state.go('login');
			return;
		});
		return deferred.promise;
	};

	this.checkActivateUser = function(token) {
		var deferred = $q.defer();
		this._checkLoggedIn().then(function() {
			$state.go('home');
			return;
		}, angular.bind(this, function() {
			this._activateUser(token).then(function(response) {
				deferred.resolve(response);
			}, function(response) {
				deferred.reject(response);
			});
		}));
		return deferred.promise;
	};

	this.checkRegister = function() {
		var deferred = $q.defer();
		this._checkLoggedIn().then(function() {
			$state.go('home');
			return;
		}, function() {
			deferred.resolve({});
		});
		return deferred.promise;
	};

	this.checkRestorePassword = function() {
		return this.checkRegister();
	};

	this.checkNewPassword = function(token) {
		var deferred = $q.defer();
		this._checkLoggedIn().then(function() {
			$state.go('home');
			return;
		}, function() {
			deferred.resolve({token: token});
		});
		return deferred.promise;
	};

	return this;
}]);
