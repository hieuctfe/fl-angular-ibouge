"use strict";

ibouge.controller("MyProfileSettingsController", [
  "$scope",
  "$rootScope",
  "SocketFactory",
  "$uibModal",
  "UserService",
  "MicroblogMapService",
  "UtilService",
  "$timeout",
  function ($scope, $rootScope, SocketFactory, $uibModal, UserService, MicroblogMapService, UtilService, $timeout) {
    var socket = SocketFactory.connection;

    socket.on("new-notification-to-show", function (event) {
      $scope.notifications.hasNewMessage = true;
      $scope.$apply();
    });

    // so the update of the user profile will
    // only go through if the necessary properties
    // for the about me, interests and languages
    // are all fulfilled
    $scope.updateProfilePropertiesNotFulfilled = false;
    $scope.getRidOfAlertMessage = false;
    $scope.profileUpdated = false;
    $scope.locationUpdated = false;

    $scope.util = UtilService;
    $scope.sess = $rootScope.sess;
    $scope.tabs = [
      { key: "profile", value: "Profile" },
      { key: "account", value: "Account" },
      { key: "privacy", value: "Privacy" },
      { key: "notifications", value: "Notifications" },
    ];
    // $scope.user = {};
    $scope.user = {
      area_name: $scope.sess.area_name,
      area_id: $scope.sess.area_id,
      profilePic:
        $scope.sess.profile_pic && $scope.sess.profile_pic !== "" ? $scope.sess.profile_pic : "img/upload-photo.png",
      gender: (function () {
        switch ($scope.sess.gender) {
          case 0:
            return "Male";
          case 1:
            return "Female";
          case 2:
            return "Other";
          default:
            return "N/A";
        }
      })(),
      age: (function () {
        var age = Math.floor((new Date() - new Date($scope.sess.dob)) / 31536000000);
        return age;
      })(),
      profile: {
        about_me: $scope.sess.profile.about_me,
        interests: $scope.sess.profile.interests,
        languages: $scope.sess.profile.languages,
      },
      location: {
        coordinates: $scope.sess.location ? $scope.sess.location.coordinates : null,
        addrs1: $scope.sess.location ? $scope.sess.location.addrs1 : null,
        addrs2: $scope.sess.location ? $scope.sess.location.addrs2 : null,
        country: (function () {
          if (!$scope.sess.location) {
            return null;
          }
          var country = $scope.util.countries.filter(function (item) {
            return item.code === $scope.sess.location.country;
          });

          if (country.length === 0) {
            return null;
          }
          return country[0];
        })(),
        state: $scope.sess.location ? $scope.sess.location.state : null,
        city: $scope.sess.location ? $scope.sess.location.city : null,
        zip: $scope.sess.location ? $scope.sess.location.zip : null,
      },
    };
    $scope.ctrl = {
      interest: null,
      language: null,
    };
    $scope.blockList = [];

    $scope.myProfileSettings = {
      img: "img/upload-photo.png",
      activeTab: "profile",
      profile: {},
      account: {
        activeTab: "general",
        general: {},
        location: {},
      },
      privacy: {},
      notifications: {},
    };

    console.log($rootScope.account);
    if ($rootScope.account === false && $rootScope.privacy === false && $rootScope.notificationsTab === false) {
      $scope.myProfileSettings.activeTab = "profile";
    }

    if ($rootScope.account === true) {
      $scope.myProfileSettings.activeTab = "account";
    }

    if ($rootScope.privacy === true) {
      $scope.myProfileSettings.activeTab = "privacy";
    }

    if ($rootScope.notificationsTab === true) {
      $scope.myProfileSettings.activeTab = "notifications";
    }
    console.log($scope.myProfileSettings.activeTab, "Active Tab");

    $scope.updateOnEnter = function (event, arr, property) {
      // if enter is pressed
      if (event.which === 13) {
        // if the person actually typed text
        if ($scope.ctrl[property] && $scope.ctrl[property].trim() !== "") {
          // change current interest or language to lower case
          var interestLowerCase = $scope.ctrl[property].toLowerCase();

          // search the array, if the current property does not
          // match anything in the current array
          if (
            interestLowerCase !==
            arr.find(function (element) {
              return interestLowerCase === element;
            })
          ) {
            // save the property in the users profile
            arr.push(interestLowerCase.trim());

            // reset the variable to be used next time
            $scope.ctrl[property] = "";
          } else {
            // the user typed something already there

            // clear the text they just typed as it is already there
            var element = document.getElementById(event.currentTarget.id);
            element.value = "";
            $scope.ctrl[property] = "";
          }
        }
      }
    };

    $scope.removeItem = function (item, arr) {
      var index = arr.indexOf(item);
      if (index < 0) {
        return;
      }

      arr.splice(index, 1);
    };

    $scope.init = function () {
      if ($rootScope.sess) {
        var user = $rootScope.sess;

        $scope.myProfileSettings.img = UserService.getProfilePic(user.profile_pic);

        // set profile section
        $scope.myProfileSettings.profile = {
          about_me: user.profile.about_me,
          interests: user.profile.interests ? user.profile.interests : [],
          languages: user.profile.languages ? user.profile.languages : [],
        };

        // set account section
        $scope.myProfileSettings.account.general = {
          fname: user.fname,
          lname: user.lname,
          gender: (function () {
            if (user.gender && (user.gender == 0 || user.gender == 1)) {
              return $scope.util.gender.filter(function (item) {
                return item.id == user.gender;
              })[0];
            }
            return $scope.util.gender[0];
          })(),
          email: user.email,
          mm: (function () {
            if (user.dob) {
              var d = new Date(user.dob);
              var mm = (d.getMonth() < 9 ? "0" : "") + (d.getMonth() + 1);
              return $scope.util.dob.mm.filter(function (item) {
                return item.id == mm;
              })[0];
            }
            return null;
          })(),
          dd: (function () {
            if (user.dob) {
              var d = new Date(user.dob);
              var dd = (d.getDate() < 9 ? "0" : "") + d.getDate();
              return $scope.util.dob.dd.filter(function (item) {
                return item == dd;
              })[0];
            }
            return null;
          })(),
          yyyy: (function () {
            if (user.dob) {
              var d = new Date(user.dob);
              var yyyy = d.getFullYear();
              return $scope.util.dob.yyyy.filter(function (item) {
                return item == yyyy;
              })[0];
            }
            return null;
          })(),
        };

        $scope.myProfileSettings.account.location = {
          addrs1: user.location && user.location.addrs1 ? user.location.addrs1 : null,
          addrs2: user.location && user.location.addrs2 ? user.location.addrs2 : null,
          country: user.location && user.location.country ? $scope.util.getCountryByCode(user.location.country) : null,
          state: user.location && user.location.state ? user.location.state : null,
          city: user.location && user.location.city ? user.location.city : null,
          zip: user.location && user.location.zip ? user.location.zip : null,
        };

        // set privacy section
        $scope.myProfileSettings.privacy = {
          only_members_see_profile: user.privacy.only_members_see_profile,
          share_recent_events: user.privacy.share_recent_events,
          show_my_friends: user.privacy.show_my_friends,
          is_profile_public: user.privacy.is_profile_public,
          new_messages: user.privacy.new_messages,
          block_list: [],
        };

        $scope.loadBlockList(user.privacy.block_list);

        // set notification section
        $scope.myProfileSettings.notifications = {
          new_messages: user.notifications.new_messages,
          new_events: user.notifications.new_events,
          friend_requests: user.notifications.friend_requests,
          invitations_to_conversation: user.notifications.invitations_to_conversation,
          // Tati's change-Lisa asked to remove this functionality
          // mutual_likes: user.notifications.mutual_likes
        };
      }
    };

    $scope.loadBlockList = function () {
      UserService.loadBlockList().then(
        function (response) {
          $scope.blockList = response.data;
        },
        function (response) {
          console.log("block list load failed");
        },
      );
    };

    $scope.updateProfile = function () {
      // if all fiends are not filled out do not let the user continue
      if (
        $scope.myProfileSettings.profile.about_me.length < 2 ||
        $scope.myProfileSettings.profile.interests.length === 0 ||
        $scope.myProfileSettings.profile.languages.length === 0
      ) {
        // variables to ensure messages only show up when necessary
        $scope.updateProfilePropertiesNotFulfilled = true;
        $scope.getRidOfAlertMessage = true;

        // after 4 seconds make it disappear
        $timeout(function () {
          $scope.getRidOfAlertMessage = false;
        }, 4000);
      } else {
        $scope.updateProfilePropertiesNotFulfilled = false;
        UserService.updateUser($rootScope.current_user, { profile: $scope.myProfileSettings.profile }).then(
          function (response) {
            if (response.data) {
              $rootScope.sess = response.data;
            }

            // add the "Updated Successfully" html to page
            $scope.profileUpdated = true;

            // after 2 seconds make it disappear
            $timeout(function () {
              $scope.profileUpdated = false;
            }, 2000);

            console.log("profile updated");
          },
          function (response) {
            console.log("profile update failed");
          },
        );
      }
    };

    $scope.updatePrivacy = function () {
      var reqData = {};
      angular.copy($scope.myProfileSettings.privacy, reqData);
      reqData.block_list = $scope.blockList.map(function (item) {
        return item._id;
      });
      // console.log('privacy : ', reqData);
      UserService.updateUser($rootScope.current_user, { privacy: reqData }).then(
        function (response) {
          if (response.data) {
            $rootScope.sess = response.data;
          }
          console.log("privacy updated");
        },
        function (response) {
          console.log("privacy update faild");
        },
      );
    };

    $scope.updateNotifications = function () {
      UserService.updateUser($rootScope.current_user, { notifications: $scope.myProfileSettings.notifications }).then(
        function (response) {
          if (response.data) {
            $rootScope.sess = response.data;
          }
          console.log("notifications updated");
        },
        function (response) {
          console.log("notifications update faild");
        },
      );
    };

    $scope.updateAccountLocation = function () {
      // get the coordinates from the user selection in the map
      // add those coordinates to the session
      var coordinates = MicroblogMapService.getCoordinates();
      $scope.user.location.coordinates = coordinates;

      // if there are coordinates, put them in the database
      // and allow the user to move on to the next step
      if (coordinates.length === 2) {
        var reqData = {};
        angular.copy($scope.user.location, reqData);
        reqData.country = reqData.country ? reqData.country.code : null;
        UserService.updateUser($rootScope.current_user, { location: reqData }).then(
          function (response) {
            if (response.data) {
              $rootScope.sess = response.data;
              // $state.go("profilesetup", { STEP: "step3" });
            }

            $scope.locationUpdated = true;
            console.log("profile updated");
          },
          function (response) {
            $scope.locationUpdated = false;

            console.log("profile update failed");
          },
        );
      }

      // var coordinates = MicroblogMapService.getCoordinates();
      // $scope.myProfileSettings.account.location = coordinates;
      // if (coordinates.length === 2) {
      //   var reqData = {};
      //   angular.copy($scope.myProfileSettings.account.location, reqData);
      //   reqData.country = reqData.country ? reqData.country.code : null;
      //   console.log("location : ", reqData);
      //   UserService.updateUser($rootScope.current_user, { location: reqData }).then(
      //     function (response) {
      //       if (response.data) {
      //         $rootScope.sess = response.data;
      //       }
      //       console.log("notifications updated");
      //     },
      //     function (response) {
      //       console.log("notifications update faild");
      //     },
      //   );
      // }
    };

    $scope.changeProfilePic = function (size) {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: "profileImage.html",
        controller: "ChangeProfilePicController",
        size: size,
        resolve: {
          user: function () {
            return $scope.sess;
          },
        },
      });

      modalInstance.result.then(
        function (data) {
          $scope.myProfileSettings.img = data.url;
          $rootScope.sess.profile_pic = data.url;
        },
        function (data) {},
      );
    };

    $scope.clickProfileImage = function () {
      $uibModal.open({
        template:
          `
		  <div class="modal-body" style="text-align: center;">
		<img style="max-width:100%; max-height: 100%" src=' ` +
          $scope.myProfileSettings.img +
          `' />
	</div>`,
        size: "lg",
        controller: function ($scope, $uibModalInstance) {
          $scope.cancel = function () {
            $uibModalInstance.dismiss("cancel");
          };
        },
      });
    };

    $scope.$on("location-updated", function () {
      console.log("location-updated");
      $scope.init();
    });

    $scope.init();
  },
]);
