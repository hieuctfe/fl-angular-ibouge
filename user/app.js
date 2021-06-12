"use strict";
//Angular Starter App

var ibouge = angular
  .module("ibouge", [
    "ui.router",
    "ui.bootstrap",
    "ngSanitize",
    "ui.select",
    "ngImgCrop",
    "ngCookies",
    "ngFileUpload",
    "ngAnimate",
    /* FIXME: ngEmojiPicker slows down dashboard by 30+ seconds */
    // "ngEmojiPicker",
    "angularSpinner",
  ])
  .run([
    "$http",
    "$rootScope",
    "$state",
    "$cookies",
    function ($http, $rootScope, $state, $cookies) {
      // whenever the page is refreshed
      // before everything is unloaded
      window.onbeforeunload = function (ev) {
        // if either the P2P or Group chats are open
        if ($rootScope.openP2PChats.length > 0 || $rootScope.openGroupChats.length > 0) {
          // broadcast the open chats to the chatDirective and
          // groupChatModalController so their logouts can be
          // set on the server so when the page is refreshed
          // the client does not show a inbox-alert from their
          // own sent messages
          $rootScope.$broadcast("refresh", {
            chats: $rootScope.openP2PChats,
            chat: $rootScope.openGroupChats,
          });
        }
      };

      if (sessionStorage.length > 0) {
        $rootScope.current_user = sessionStorage.current_user;
        $rootScope.authenticated = true;
      } else {
        $rootScope.authenticated = false;
        $rootScope.current_user = null;
      }

      $rootScope.$on("$stateChangeSuccess", function () {
        $rootScope.title = $state.current.data.title;
      });

      $rootScope.signout = function () {
        $rootScope.$broadcast("signout");

        // delete remember me
        var expires = new Date();
        expires.setFullYear(1970);
        $cookies.put("remember_me", undefined, { expires: expires });

        $http.get("auth/signout").then(
          function () {
            $state.go("login");
          },
          function () {
            $state.go("login");
          },
        );

        $rootScope.isLoggedOut = true;
        $rootScope.authenticated = false;
        $rootScope.current_user = null;
        $rootScope.sess = null;
        sessionStorage.clear();
      };
    },
  ]);
