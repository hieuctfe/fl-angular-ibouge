"use strict";
//Routing Configuration (define routes)

ibouge.config([
  "$stateProvider",
  "$urlRouterProvider",
  "$locationProvider",
  function ($stateProvider, $urlRouterProvider, $locationProvider) {
    // $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise("/");
    $stateProvider
      .state("home", {
        url: "/",
        templateUrl: "usersMainMapArea.html",
        controller: "MainController",
        data: {
          title: "iBouge - Homepage",
        },
        resolve: {
          loggedin: function (AuthService) {
            return AuthService.checkValid();
          },
        },
      })
      .state("mapOverview", {
        url: "/mapOverview",
        templateUrl: "mapOverview.html",
        data: {
          title: "iBouge - MapOverview",
        },
        resolve: {
          loggedin: function (AuthService) {
            return AuthService.checkValid();
          },
        },
      })
      .state("mapOSM", {
        url: "/mapOSM",
        templateUrl: "mapOSM.html",
        controller: "MapController",
        resolve: {
          loggedin: function (AuthService) {
            return AuthService.checkValid();
          },
        },
      })
      .state("mydashboard", {
        url: "/mydashboard",
        templateUrl: "myDashboard.html",
        controller: "MyDashboardController",
        data: {
          title: "iBouge - Dashboard",
        },
        resolve: {
          loggedin: function (AuthService) {
            return AuthService.checkValid();
          },
        },
      })
      .state("myprofilesettings", {
        url: "/myprofilesettings",
        templateUrl: "myProfileSettings.html",
        controller: "MyProfileSettingsController",
        data: {
          title: "iBouge - Settings",
        },
        resolve: {
          loggedin: function (AuthService) {
            return AuthService.checkValid();
          },
        },
      })
      .state("profile", {
        url: "/profile/:USER_ID",
        templateUrl: "profile.html",
        controller: "ProfileController",
        data: {
          title: "iBouge - Profile",
        },
        resolve: {
          loggedin: function (AuthService) {
            return AuthService.checkValid();
          },
        },
      })
      .state("event", {
        url: "/event/:eventId",
        templateUrl: "event.html",
        controller: "EventController",
        data: {
          title: "iBouge - Event",
        },
        resolve: {
          loggedin: function (AuthService) {
            return AuthService.checkValid();
          },
        },
      })
      .state("createEvent", {
        url: "/create-event",
        templateUrl: "createEvent.html",
        controller: "CreateEventController",
        data: {
          title: "iBouge - Create Event",
        },
        resolve: {
          loggedin: function (AuthService) {
            return AuthService.checkValid();
          },
          step: function () {
            return "step1";
          },
        },
      })
      .state("profilesetup", {
        url: "/profilesetup/:STEP",
        templateUrl: "profileSetup.html",
        controller: "ProfileSetupController",
        data: {
          title: "iBouge - Profile Setup",
        },
        resolve: {
          step: function (AuthService, $stateParams) {
            return AuthService.chekcProfileActivationStep($stateParams.STEP);
          },
        },
      })
      .state("login", {
        url: "/login?token",
        templateUrl: "login.html",
        controller: "AuthController",
        data: {
          title: "iBouge - Login",
        },
        resolve: {
          state: function () {
            return "login";
          },
          options: function (AuthService, $stateParams) {
            return AuthService.checkActivateUser($stateParams.token);
          },
        },
      })
      .state("register", {
        url: "/register",
        templateUrl: "register.html",
        controller: "AuthController",
        data: {
          title: "iBouge - Register",
        },
        resolve: {
          state: function () {
            return "register";
          },
          options: function (AuthService) {
            return AuthService.checkRegister();
          },
        },
      })
      .state("restorepassword", {
        url: "/restorepassword",
        templateUrl: "restorePassword.html",
        controller: "AuthController",
        data: {
          title: "iBouge - Restore Password",
        },
        resolve: {
          state: function () {
            return "restorepassword";
          },
          options: function (AuthService) {
            return AuthService.checkRestorePassword();
          },
        },
      })
      .state("newpassword", {
        url: "/newpassword?token",
        templateUrl: "newPassword.html",
        controller: "AuthController",
        data: {
          title: "iBouge - New Password",
        },
        resolve: {
          state: function () {
            return "newpassword";
          },
          options: function (AuthService, $stateParams) {
            return AuthService.checkNewPassword($stateParams.token);
          },
        },
      })
      .state("unauth", {
        url: "/unauth",
        templateUrl: "unauth.html",
      })
      .state("otherwise", {
        url: "/login?token",
        templateUrl: "login.html",
        controller: "AuthController",
        data: {
          title: "iBouge - Login",
        },
        resolve: {
          state: function () {
            return "login";
          },
          options: function (AuthService, $stateParams) {
            return AuthService.checkActivateUser($stateParams.token);
          },
        },
      });
  },
]);
