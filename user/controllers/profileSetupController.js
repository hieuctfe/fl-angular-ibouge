"use strict";

ibouge.controller("ProfileSetupController", [
  "$scope",
  "$rootScope",
  "SocketFactory",
  "$uibModal",
  "$state",
  "UtilService",
  "UserService",
  "step",
  "MicroblogMapService",
  "ProfileSetupMapService",
  "$timeout",
  function (
    $scope,
    $rootScope,
    SocketFactory,
    $uibModal,
    $state,
    UtilService,
    UserService,
    step,
    MicroblogMapService,
    ProfileSetupMapService,
    $timeout,
  ) {
    // profile step three variabale for text change
    $scope.profileSetupMapVariable = 1;

    $scope.stepOneNotComplete = false;

    // function to change the profile setup step three text
    // according to where the user is in the process
    $rootScope.profileSetupMapFunction = function (stepNumber) {
      $scope.profileSetupMapVariable = stepNumber;
      $scope.$apply();
    };

    // maps icon color is blue
    $rootScope.iconColor = "#319CED";

    $scope.step = step;
    $scope.util = UtilService;
    $scope.sess = $rootScope.sess;
    $scope.ctrl = {
      interest: null,
      language: null,
    };

    var socket = SocketFactory.connection;

    socket.on("new-notification-to-show", function (event) {
      $scope.notifications.hasNewMessage = true;
      $scope.apply();
    });

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

    String.prototype.replaceAt = function (index, char) {
      var a = this.split("");
      a[index] = char;
      return a.join("");
    };

    $scope.updateOnEnter = function (event, arr, property) {
      // if enter is pressed
      // arr = [];
      // if (event.which === 13) {
      if ($scope.ctrl[property] && $scope.ctrl[property].trim() !== "") {
        const result = $scope.ctrl[property].split(",");
        const newResult = [];
        const newResult1 = [];
        result.map((x) => {
          newResult.push(x.replace(/&/g, ","));
        });
        newResult.map((y) => {
          const index = y.indexOf(",");
          if (index) {
            const split = y.split(",");
            split.map((z) => {
              if (z !== "" && y !== "and" && y !== "And" && y !== "AND") {
                newResult1.push(z.toLowerCase());
              }
            });
          } else {
            if (y !== "and" && y !== "And" && y !== "AND") {
              newResult1.push(y.toLowerCase());
            }
          }
        });
        console.log(newResult1);
        newResult1.map((x) => {
          if (
            x !==
            arr.find(function (element) {
              return x === element;
            })
          ) {
            // save the property in the users profile
            arr.push(x.trim());
          }
        });
        // // if the person actually typed text
        // if ($scope.ctrl[property] && $scope.ctrl[property].trim() !== "") {
        //   // change current interest or language to lower case
        //   console.log($scope.ctrl[property]);
        //   var interestLowerCase = $scope.ctrl[property].toLowerCase();

        //   // search the array, if the current property does not
        //   // match anything in the current array
        //   if (
        //     interestLowerCase !==
        //     arr.find(function (element) {
        //       return interestLowerCase === element;
        //     })
        //   ) {
        //     // save the property in the users profile
        //     arr.push(interestLowerCase.trim());

        //     // reset the variable to be used next time
        //     $scope.ctrl[property] = "";
        //   } else {
        //     // the user typed something already there

        //     // clear the text they just typed as it is already there
        //     var element = document.getElementById(event.currentTarget.id);
        //     element.value = "";
        //     $scope.ctrl[property] = "";
        //   }
        // }
      }
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
          $scope.user.profilePic = data.url;
        },
        function (data) {},
      );
    };

    $scope.completeStep1 = function () {
      UserService.updateUser($rootScope.current_user, { activation_status: 1, profile: $scope.user.profile }).then(
        function (response) {
          if (response.data) {
            $rootScope.sess = response.data;
            $state.go("profilesetup", { STEP: "step2" });
            $scope.stepOneNotComplete = true;
          }
          console.log("profile updated");
        },
        function (response) {
          console.log("profile update failed");
        },
      );
    };

    $scope.completeStep2 = function () {
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
        UserService.updateUser($rootScope.current_user, { activation_status: 2, location: reqData }).then(
          function (response) {
            if (response.data) {
              $rootScope.sess = response.data;
              $state.go("profilesetup", { STEP: "step3" });
            }
            console.log("profile updated");
          },
          function (response) {
            console.log("profile update failed");
          },
        );
      }
    };

    $scope.completeStep3 = function () {
      // get the users selected areas bounding box and place in variable
      var clientsInfo = ProfileSetupMapService.getCityAndBoundingBox();
      console.log(clientsInfo);
      // request data to be sent to database
      var reqData = {
        activation_status: 3,
        area_id: $scope.user.area_id,
        area_name: $scope.user.area_name,
        location: {
          lastCityFollowed: clientsInfo.cityName,
          cityToFollow: {
            cityName: clientsInfo.cityName,
            bbox: clientsInfo.bbox,
            center: clientsInfo.center,
          },
          extraCityToFollow0: {
            cityName: clientsInfo.cityName,
            bbox: clientsInfo.bbox,
            center: clientsInfo.center,
          },
          extraCityToFollow1: {
            cityName: clientsInfo.cityName2,
            bbox: clientsInfo.bbox2,
            center: clientsInfo.center2,
          },
          extraCityToFollow2: {
            cityName: clientsInfo.cityName3,
            bbox: clientsInfo.bbox3,
            center: clientsInfo.center3,
          },
        },
      };

      // ensures the step is not completed unless a bbox is found
      // this is so a user doesn't quickly click "Create Account"
      // until they are fully done choosing a bounding box
      if (clientsInfo.bbox.ne && clientsInfo.bbox.sw) {
        UserService.updateUser($rootScope.current_user, reqData).then(
          function (response) {
            if (response.data) {
              $rootScope.sess = response.data;
              UserService.updateMyLocation();
              $state.go("home");
            }
            console.log("profile updated");
          },
          function (response) {
            console.log("profile update failed");
          },
        );
      }
    };
  },
]);
