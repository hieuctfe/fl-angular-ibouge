"use strict";

ibouge.controller("MyDashboardController", [
  "$scope",
  "$uibModal",
  "$state",
  "$rootScope",
  "UserService",
  "UtilService",
  "ChatService",
  "MicroblogService",
  "SocketFactory",
  "MicroblogMapService",
  "EventService",
  "DashboardMapService",
  "$timeout",
  "$http",
  "StatusUpdatesService",
  "orderByFilter",
  "Upload",
  "SaveDataToS3Bucket",
  function (
    $scope,
    $uibModal,
    $state,
    $rootScope,
    UserService,
    UtilService,
    ChatService,
    MicroblogService,
    SocketFactory,
    MicroblogMapService,
    EventService,
    DashboardMapService,
    $timeout,
    $http,
    StatusUpdatesService,
    orderBy,
    Upload,
    SaveDataToS3Bucket,
  ) {
    $scope.cachedUsers = [];
    $scope.US = UserService;
    $scope.util = UtilService;
    $scope.myEvents = [];
    $scope.myMicroblogs = [];
    $scope.myFriends = {
      total: 0,
      friends: [],
    };
    $scope.likedByMe = false;

    // vars to hold "follow" circle bbox and center
    $scope.circleBBox = {};
    $scope.circleCenter = {};

    $scope.usersDatabaseInfo = {};

    $scope.citiesToFollow = ["", "add new", "add new"];

    $scope.locationToBeSaved = "";

    // vars used for status updates
    $scope.allStatusUpdates = [];

    $scope.status = {
      user: $rootScope.sess._id,
      message: {
        status_type: "",
        message: "",
      },
      reply: {
        reply_type: "text",
        message: "",
      },
    };

    $scope.Files = [];
    $scope.reverse = true;
    $scope.usersInMap = [];
    $scope.mapStatusesOnlyShown = true;
    $scope.friendsStatusesOnlyShown = false;

    // get the socket connection to the server
    var socket = SocketFactory.connection;

    $scope.linkify = function (text) {
      var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
      return text.replace(urlRegex, function (url) {
        return '<a href="' + url + '">' + url + "</a>";
      });
    };

    $scope.init = function () {
      // get the element to add the map to
      var element = document.getElementById("chartEventViewMap");

      // load the map and add it to the element
      DashboardMapService.loadMap(element)
        .then(function (eventsAndUsers) {
          $scope.mapStatusesOnlyShown = true;
          $scope.allStatusUpdates = [];
          $scope.usersInMap = eventsAndUsers.users;

          $scope.loadMyEvents(eventsAndUsers.events);
          $scope.loadMetaData();
          $scope.loadMyFriends();
          $scope.loadMyMicroblogs();
          $scope.loadUserData();
          $scope.showOnlyUsersInMapUpdates(eventsAndUsers.users);
        })
        .catch(function (error) {
          console.log(error);
        });

      // this socket listens for new status updates. Then it checks weather user is currently in map or friends status
      // updates. If user is in map it checks if the status is from a person that is part of map area, otherwise, if
      // user is in friends, it checks if the status is from a friend or not. If so on either instances, it will add
      // the status update to array $scope.allStatusUpdates, which will show the status immediately.
      socket.on("new-status-to-show", function (event) {
        if ($scope.mapStatusesOnlyShown) {
          for (var i = 0; i < $scope.usersInMap.length; i++) {
            if ($scope.usersInMap[i]._id === event.from) {
              $scope.allStatusUpdates.unshift({
                _id: event._id,
                message: event.message,
                caption: event.caption,
                status_type: event.status_type,
                time: event.time,
                from: event.from,
                userFullname: event.userFullname,
                likes: event.likes,
                profilePic: event.profilePic,
              });
              $scope.$apply();
            }
          }
        } else if ($scope.friendsStatusesOnlyShown) {
          for (var j = 0; j < $scope.myFriends.friends.length; j++) {
            if ($scope.myFriends.friends[j]._id === event.from) {
              $scope.allStatusUpdates.unshift({
                _id: event._id,
                message: event.message,
                caption: event.caption,
                status_type: event.status_type,
                time: event.time,
                from: event.from,
                userFullname: event.userFullname,
                likes: event.likes,
                profilePic: event.profilePic,
              });
              $scope.$apply();
            }
          }
        }
      });

      socket.on("new-reply-to-show", function (event) {
        var targetStatus = $scope.allStatusUpdates.filter(function (oStatus) {
          return oStatus._id == event.status_id;
        })[0];
        if (!targetStatus.replies) {
          targetStatus.replies = [];
        }
        targetStatus.replies.unshift(event);
        $scope.$apply();
      });

      socket.on("new-notification-to-show", function (event) {
        $scope.notifications.hasNewMessage = true;
        $scope.$apply();
      });

      socket.on("status-to-delete", function (data) {
        $scope.allStatusUpdates = $scope.allStatusUpdates.filter(function (el) {
          return el._id !== data._id;
        });
        $scope.$apply();
      });

      socket.on("reply-to-delete", function (data) {
        var targetStatus = $scope.allStatusUpdates.filter(function (oStatus) {
          return oStatus._id == data.status_id;
        })[0];
        targetStatus.replies = targetStatus.replies.filter(function (el) {
          return el._id !== data.reply_id;
        });
        $scope.$apply();
      });
    };

    $scope.$on("presence", function (event, presenceData) {
      if ($scope.myFriends.friends) {
        for (var i = 0; i < $scope.myFriends.friends.length; i++) {
          if ($scope.myFriends.friends[i]._id == presenceData.user_id) {
            $scope.$apply(function () {
              $scope.myFriends.friends[i].is_online = presenceData.status;
            });
          }
        }
      }
    });

    // this function loads all events created by all users
    $scope.loadMyEvents = function (events) {
      console.log("loadMyEvents");

      $scope.myEvents = events;
      $scope.propertyName = "createdDate";

      // display them in the order they were created
      $scope.myEvents = orderBy($scope.myEvents, $scope.propertyName, $scope.reverse);

      // this event listener makes sure that if the user has chosen a picture for the event, that the image shows
      // as soon as they are re-routed to the dashboard. Otherwise it won't show until the page is refreshed.
      $rootScope.$on("event-picture-info", function (event, params) {
        var path = params;
        $scope.myEvents[0].eventImage = path;
      });

      // if user has not chosen a picture for the event
      for (var i = 0; i < $scope.myEvents.length; i++) {
        // if event has no uploaded image, a generic picture will be assigned to it here
        if ($scope.myEvents[i].eventImage === undefined || $scope.myEvents[i].eventImage === "") {
          $scope.myEvents[i].eventImage = "img/noImageAvailable.jpg";
        }

        // this sets the event.status variable to "GOING" if session user is in the "going" array
        for (var j = 0; j < $scope.myEvents[i].going.length; j++) {
          if ($rootScope.sess._id === $scope.myEvents[i].going[j].userId) {
            $scope.myEvents[i].status = "GOING";
          }
        }
      }
    };

    $scope.loadUserData = function () {
      console.log("loadUserData");
      UserService.getUser($rootScope.sess._id).then(
        function (args) {
          // place the users database info in a $scope variable
          $scope.usersDatabaseInfo = args.data;

          // counter so the city names will
          // be put in the correct place in the array
          var counter = 1;

          // for every property in the users location object in the database
          for (var property in args.data.location) {
            // if the property is there AND if the property has a cityName property
            if (
              args.data.location[property] !== null &&
              args.data.location[property].hasOwnProperty("cityName") &&
              property !== "cityToFollow"
            ) {
              // if the properties cityName is the same as the last city followed
              if (args.data.location[property].cityName === args.data.location.lastCityFollowed) {
                // add the cities name to the 0 index in the $scope.citiesToFollow array below
                $scope.citiesToFollow[0] = args.data.location.lastCityFollowed;
              } else {
                // else place the locations properties cityName in the 1 or 2 index
                // in the $scope.citiesToFollow array below.  Also add 1 to the counter
                // for next time around if there are 3 cities to follow total
                $scope.citiesToFollow[counter] = args.data.location[property].cityName;
                counter++;
              }
            }
          }
        },
        function (err) {
          console.log("user info load err :", err);
        },
      );
    };

    $scope.loadMetaData = function () {
      console.log("loadMetaData");
      UserService.getMyDashboardMetaData().then(
        function (metadata) {
          // $scope.myFriends.total = metadata.friends_count;
        },
        function (err) {
          console.log("friends load err :", err);
        },
      );
    };

    $scope.loadMyFriends = function () {
      console.log("loadMyFriends");
      UserService.getMyFriends().then(
        function (friends) {
          $scope.myFriends.total = friends.length;
          $scope.myFriends.friends = $scope.myFriends.friends.concat(friends);
        },
        function (err) {
          console.log("friends load err :", err);
        },
      );
    };

    $scope.getUserProfileAndName = function (id, cb) {
      UserService.getUserMeta(id).then(function (info) {
        var profilePic;
        var fname = info[0].fname;
        var lname = info[0].lname;
        if (!info[0].profile_pic || info[0].profile_pic === "") {
          profilePic = "img/noImageAvailable.jpg";
        } else {
          profilePic = info[0].profile_pic;
        }

        var res = {
          userFullname: fname + " " + lname,
          profilePic: profilePic,
        };

        cb(res);
      });
    };

    // this function gets the user's full name and profile picture for status updates
    $scope.getUserName = function (listName) {
      var list;
      if (listName == "statuses") {
        list = $scope.allStatusUpdates;
      } else if (listName == "likes") {
        list = $scope.likes;
      } else {
        return;
      }
      for (var id = 0; id < list.length; id++) {
        const tmp_id = id;
        var profilePic = "";
        UserService.getUserMeta(list[id].from).then(function (info) {
          var fname = info[0].fname;
          var lname = info[0].lname;
          if (!info[0].profile_pic || info[0].profile_pic === "") {
            profilePic = "img/noImageAvailable.jpg";
          } else {
            profilePic = info[0].profile_pic;
          }
          try {
            list[tmp_id].userFullname = fname + " " + lname;
            list[tmp_id].profilePic = profilePic;
          } catch (err) {
            console.log(err);
          }
          if (list[tmp_id].replies) {
            for (var j = 0; j < list[tmp_id].replies.length; j++) {
              const tmp_j = j;
              UserService.getUserMeta(list[tmp_id].replies[j].from).then(function (info) {
                fname = info[0].fname;
                lname = info[0].lname;
                if (!info[0].profile_pic || info[0].profile_pic === "") {
                  profilePic = "img/noImageAvailable.jpg";
                } else {
                  profilePic = info[0].profile_pic;
                }
                try {
                  list[tmp_id].replies[tmp_j].userFullname = fname + " " + lname;
                  list[tmp_id].replies[tmp_j].profilePic = profilePic;
                } catch (err) {
                  console.log(err);
                }
              });
            }
          }
        });
      }
    };

    // user will be routed to the page to create a new event
    $scope.goToCreateEventPage = function () {
      $state.go("createEvent");
    };

    // user will be routed to event chosen, sending the event id to stateParams
    $scope.viewEvent = function (event) {
      var id = event._id;
      $state.go("event", { eventId: id });
    };

    // when a person clicks the heart, it will add a like or remove their already existing like
    $scope.addLike = function (event) {
      var inList = false;
      var data = {
        event: event._id,
        me: $rootScope.sess._id,
      };

      // iterate through likes array to check if user has already liked event
      // if user is in array, inList variable will be equal to true, else false
      if (event.likes.length > 0) {
        for (var i = 0; i < event.likes.length; i++) {
          if (data.me === event.likes[i].user) {
            inList = true;

            //if user is found, iteration will stop
            break;
          } else {
            inList = false;
          }
        }

        // if user is in the list of likes, user will be removed from list
        if (inList) {
          // here we find the index of the event in the $scope.myEvents array
          var a = $scope.myEvents
            .map(function (x) {
              return x._id;
            })
            .indexOf(data.event);

          // here we find the index of the user in the $scope.myEvents[a].likes array
          var likesIndex = $scope.myEvents[a].likes
            .map(function (y) {
              return y.user;
            })
            .indexOf(data.me);

          // with both of those indexes we can now update the local $scope.myEvents.likes array, which will affect
          // immediately the number of likes displayed
          $scope.myEvents[a].likes.splice(likesIndex, likesIndex + 1);

          // but database also needs to be updated, here
          socket.emit("remove-event-like", data);

          // if user is not in the likes list, user will be added to it
        } else {
          // we find the index of event to be updated
          var b = $scope.myEvents
            .map(function (x) {
              return x._id;
            })
            .indexOf(data.event);

          // local $scope.myEvents array is updated
          $scope.myEvents[b].likes.push({ user: data.me, date: Date.now() });

          // databse info is updated
          socket.emit("add-event-like", data);
        }
        // if event.likes array is empty, this will push a like automatically
      } else {
        // index found
        var c = $scope.myEvents
          .map(function (x) {
            return x._id;
          })
          .indexOf(data.event);

        // local array updated
        $scope.myEvents[c].likes.push({ user: data.me, date: Date.now() });

        // databse updated
        socket.emit("add-event-like", data);
      }
    };

    $scope.loadMyMicroblogs = function () {
      console.log("loadMyMicroblogs");
      UserService.loadMicroblogs().then(
        function (microblogs) {
          $scope.myMicroblogs = microblogs;
        },
        function () {},
      );
    };

    $scope.getMicroblogPic = function (img) {
      return MicroblogService.getMicroblogPic(img);
    };

    $scope.closePopover = function (friendId) {
      for (var i = 0; i < $scope.myFriends.friends.length; i++) {
        if ($scope.myFriends.friends[i]._id == friendId) {
          $scope.myFriends.friends[i].showPopover = false;
          break;
        }
      }
    };

    $scope.removeThumbnail = function () {
      $scope.upload = null;
    };

    $scope.getInterestStr = function (interests) {
      var interestStr = "";
      for (var i = 0; i < interests.length; i++) {
        if (i < interests.length - 1) {
          interestStr += interests[i] + ", ";
        } else {
          interestStr += interests[i];
        }
      }
      return interestStr;
    };

    $scope.startConversation = function (users) {
      switch (users.length) {
        case 0:
          break;
        case 1:
          $rootScope.$broadcast("open-chat", users[0]);
          break;
        default:
          $state.go("home");
          var userIds = users.map(function (user) {
            return user._id;
          });
          var data = {
            name: "Group Chat",
            users: userIds,
          };
          ChatService.createGroupChat(data).then(
            function (chat) {
              $rootScope.$broadcast("open-group-chat", chat);
            },
            function (err) {
              console.log("group chat creation failed :", err);
            },
          );
          break;
      }
    };

    // This opens a microblog
    $scope.openMicroblogModal = function (microblog) {
      $state.go("home");
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: "microblog.html",
        controller: "MicroblogController",
        resolve: {
          microblogToOpen: function () {
            return microblog;
          },
        },
      });
      modalInstance.result.then(
        function (data) {},
        function (data) {},
      );
    };

    // this opens a microblog shown in the dashboard under "My Microblogs"
    $scope.openMicroblogFromList = function (microblog) {
      MicroblogService.getMicroblog(microblog.room).then(
        function (microblog) {
          $scope.openMicroblogModal(microblog);
        },
        function (err) {},
      );
    };

    // This opens the modal to create a new microblog
    $scope.createNewMicroblog = function (size) {
      // map icon will be pink
      $rootScope.iconColor = "#FD7088";

      $uibModal.open({
        animation: true,
        templateUrl: "createMicroblog.html",
        size: "md",
        controller: function ($rootScope, $scope, $uibModal, $uibModalInstance, MicroblogService, usSpinnerService) {
          $scope.ctrl = {
            microblogName: null,
            microblogImg: "img/upload-photo.png",
          };

          // this modal is opened to choose a pic for microblog when creating it
          $scope.setMicroblogPic = function (size) {
            var modalInstance = $uibModal.open({
              animation: true,
              templateUrl: "profileImage.html",
              size: size,
              controller: function ($scope, $uibModalInstance) {
                $scope.microblogImageFile = {};
                $scope.originalImage = "";
                $scope.croppedImage = "";
                $scope.convertedImage = "";
                $scope.type = null;

                $scope.handleFileSelect = function (evt) {
                  // assign picture file to $scope.microblogImageFile
                  $scope.microblogImageFile = evt.currentTarget.files[0];

                  // create temporary link to picture and apply immediately
                  $scope.$apply(function ($scope) {
                    $scope.originalImage = URL.createObjectURL($scope.microblogImageFile);
                  });
                };

                // when user has chosen a picture for microblog and they click orange 'upload' button
                $scope.upload = function () {
                  if ($scope.croppedImage === "") {
                    return;
                  }

                  // this will convert url back to a file we can send to the server
                  function dataURItoBlob(dataURI) {
                    var binary = atob(dataURI.split(",")[1]);
                    var array = [];
                    for (var i = 0; i < binary.length; i++) {
                      array.push(binary.charCodeAt(i));
                    }
                    return new Blob([new Uint8Array(array)], { type: "image/jpeg" });
                  }

                  // draw cropped image to a canvas
                  var canvas = document.getElementById("ibg-image-to-canvas");
                  var context = canvas.getContext("2d");
                  var img = document.getElementById("ibg-cropped-image");
                  context.drawImage(img, 0, 0, 88, 88);

                  // convert canvas to image
                  $scope.convertedImage = canvas.toDataURL("image/jpeg");
                  var blobData = dataURItoBlob($scope.convertedImage);

                  // these variables will be resolved when modal is closed
                  var file = blobData;
                  var albumName = "microblog-image";

                  // resolve variables to main controller
                  $uibModalInstance.close({ image: $scope.convertedImage, file: file, albumName: albumName });
                };

                $scope.cancel = function () {
                  $uibModalInstance.dismiss();
                };
              },
            });

            // data resolved from modal
            modalInstance.result.then(
              function (data) {
                $scope.ctrl.microblogImg = data.image;
                $scope.microblogImageFile = data.file;
                $scope.albumName = data.albumName;
              },
              function (data) {},
            );
          };

          // this opens the microblog just made
          $scope.openMicroblogModal = function (size, microblog) {
            $state.go("home");
            var modalInstance = $uibModal.open({
              animation: true,
              templateUrl: "microblog.html",
              controller: "MicroblogController",
              size: size,
              resolve: {
                microblogToOpen: function () {
                  return microblog;
                },
              },
            });

            modalInstance.result.then(
              function (data) {},
              function (data) {},
            );
          };

          // This function is called when the "create" button is clicked in the
          // create new microblog modal
          $scope.createMicroblog = function () {
            var users = [];
            var userIds = users.map(function (user) {
              return user._id;
            });

            // data to send to createMicroblog function in MicroblogService
            var data = {
              name: $scope.ctrl.microblogName,
              users: userIds,
              microblogImgFile: $scope.microblogImageFile,
              coordinates: MicroblogMapService.getCoordinates(),
              albumName: $scope.albumName,
            };

            // start loading spinner
            usSpinnerService.spin("spinner-4");

            // create new microblog
            MicroblogService.createMicroblog(data).then(
              function (microblog) {
                // stop loading spinner
                usSpinnerService.stop("spinner-4");

                // close this modal
                $scope.closeWindow();

                // open microblog just created
                $scope.openMicroblogModal(size, microblog);
              },
              function (err) {
                console.log("microblog creation failed :", err);
              },
            );
          };

          $scope.closeWindow = function () {
            $uibModalInstance.dismiss();
          };
        },
      });
    };

    $scope.showsLikesList = function (likes) {
      $scope.likes = likes;
      $scope.getUserName("likes");
      // create the modal
      $scope.modalInstance = $uibModal.open({
        templateUrl: "showLikesList.html",
        size: "md",
        windowClass: "showLikesList",
        scope: $scope,
      });
    };

    // function called onClick of dashboards top right corner map "+ add new"
    // or on cities drop down "add another location"
    $scope.addNewLocationToFollow = function () {
      // create the modal
      $scope.modalInstance = $uibModal.open({
        templateUrl: "addNewLocationToFollow.html",
        size: "md",
        windowClass: "addNewLocation",
        scope: $scope,
      });

      // once the modal is completely rendered
      $scope.modalInstance.rendered.then(
        function () {
          // means an error message can be displayed
          // when user hasn't searched for a new city
          $scope.searchForCityErrorMessage = true;

          // get the element to attach the map to
          var element = document.getElementById("followAnotherLocationMap");

          // create the new Mapboxgl map
          var map = new mapboxgl.Map({
            container: element,
            style: "https://api.maptiler.com/maps/positron/style.json?key=RGierAHokphISswP6JTB",
            interactive: false, // this means none of the zoom or scroll etc will work
          });

          // ibouge mapboxgl token to be used with their APIs
          mapboxgl.accessToken =
            "pk.eyJ1IjoiaWJvdWdlIiwiYSI6ImNqY2wzaXJ5YTAycWIzM2pyb3JhN20yenkifQ.jhimhHWkb-6GD3Tq8bvCKA";

          // create geocoder
          var geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            types: "place", // geocoder will on search for cities
          });

          // get element to attach the geocoder search bar to
          document.getElementById("followAnotherLocationGeocoder").appendChild(geocoder.onAdd(map));

          var myCircle = undefined;

          // after the geocoder has found it's result
          // it moves the map to the result
          geocoder.on("result", function (event) {
            // var ensures "save" button cannot
            // be clicked until the map end it's move
            $scope.canClickSave = false;

            $scope.searchForCityErrorMessage = false;

            // after the map has reached it's destination
            map.once("moveend", function () {
              // var to hold the name of the city
              // the user just searched for
              $scope.extraCityToFollowName = event.result.text;

              // already an orange circle on the screen
              // if so then remove it
              if (myCircle !== undefined) {
                myCircle.remove();
              }

              // if map interactivity is disabled
              // this will run when modal is first loaded
              // because interactivity is disabled
              // when the map is first loaded
              if (!map.scrollZoom.isEnabled()) {
                // add back all of the maps interactivity
                map.scrollZoom.enable();
                map.boxZoom.enable();
                map.dragPan.enable();
                map.dragRotate.enable();
                map.keyboard.enable();
                map.doubleClickZoom.enable();
                map.touchZoomRotate.enable();

                // add zoom feature to map screen, bottom right corner
                map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
              }

              // get the center of the current map
              // so we know where to put the orange circle
              var centerOfMap = map.getCenter();

              // create a circle to place on the map so the user can
              // choose a radius from the area they want to follow
              // circle will be placed in the middle of the map after
              // geocoder pans the map to the new position
              myCircle = new MapboxCircle(centerOfMap, 20000, {
                editable: true,
                minRadius: 1500,
                strokeColor: "#FAC82D",
                strokeWeight: 2,
                fillColor: "#FAC82D",
                fillOpacity: 0.25,
              }).addTo(map, "place_city");

              // gets the circles bbox and center directly
              // after it loads on the screen
              $scope.circleBBox = myCircle.getBounds();
              $scope.circleCenter = myCircle.getCenter();

              // when the client changes the radius
              // update the circles bbox and center coordinates
              myCircle.on("radiuschanged", function (circleObject) {
                $scope.circleBBox = circleObject.getBounds();
                $scope.circleCenter = circleObject.getCenter();
              });

              // when the circles center is changed
              // update its bbox and center coordinates
              myCircle.on("centerchanged", function (circleObject) {
                $scope.circleBBox = circleObject.getBounds();
                $scope.circleCenter = circleObject.getCenter();
              });

              // don't allow user to click
              // save until everything has loaded
              $scope.canClickSave = true;
            });
          });
        },
        function () {
          console.log("Error: Modal was not rendered!");
        },
      );
    };

    // runs when save button is clicked in the follow
    // another city modal
    $scope.saveLocationToFollow = function () {
      // ensures the red error text transition gets
      // reset when the modal closes so it will
      // work the next time
      $scope.modalInstance.closed.then(function () {
        $scope.locationToBeSaved = "";
        $scope.canClickSave = false;
        $scope.searchForCityErrorMessage = false;
      });

      // if everything has been loaded
      if ($scope.canClickSave === true) {
        // if a location to change hasn't been selected
        if ($scope.locationToBeSaved === "") {
          // alert the user by text color transition from red back to normal
          document.getElementById("chooseLocationToChange").style.color = "red";

          $timeout(function () {
            document.getElementById("chooseLocationToChange").style.color = "#474d59";
          }, 1000);

          // continue with saving everything
        } else {
          // if the user clicked on an 'add new' link
          if ($scope.locationToBeSaved === "add new") {
            $scope.locationToBeSaved = $scope.propertyToSendToDatabase;

            // else the user to not click on an 'add new' link
          } else {
            // search through the $scope.usersDatabaseInfo.location properties
            // and find which city saved in database corresponds to the city
            // the user wants to edit or change
            // make the $scope.locationToBeSaved with the matching property
            // so it replace the appropriate location in the database
            for (var property in $scope.usersDatabaseInfo.location) {
              if (
                $scope.usersDatabaseInfo.location[property] !== null &&
                $scope.usersDatabaseInfo.location[property].hasOwnProperty("cityName")
              ) {
                if ($scope.usersDatabaseInfo.location[property].cityName === $scope.locationToBeSaved) {
                  $scope.locationToBeSaved = property;
                }
              }
            }
          }

          // var to hold info from the new location to save
          // this was necessary to make so that the objects key
          // could be dynamically changed so the info sent to the
          // database would be correct ($scope.locationToBeSaved)
          var cityToSaveInfo = {
            location: {},
          };

          // add all necessary circle info to the users database
          cityToSaveInfo.location[$scope.locationToBeSaved] = {
            // below cityName comes from geocoder after search
            // is done and the map is finished moved
            cityName: $scope.extraCityToFollowName,
            bbox: $scope.circleBBox,
            center: $scope.circleCenter,
          };

          // add the last city the user chose to follow to the users database
          cityToSaveInfo.location.lastCityFollowed = $scope.extraCityToFollowName;

          // update the user
          UserService.updateUser($rootScope.current_user, cityToSaveInfo).then(
            function (data) {
              // reload the user data so the correct
              // cities name will appear
              $scope.loadUserData();

              // close the modal automatically
              $scope.modalInstance.close();

              // reload the dashboards map to the new cities coordinates
              DashboardMapService.reloadMap($scope.locationToBeSaved, $scope);

              // set var back to empty for next time
              $scope.locationToBeSaved = "";
            },
            function () {
              console.log("Update failed!");
            },
          );
        }
      } else {
        // if we are allowed to show an error message
        if ($scope.searchForCityErrorMessage === true) {
          // do a text color transition to show error
          document.getElementById("saveLocationToFollow").style.color = "red";

          $timeout(function () {
            document.getElementById("saveLocationToFollow").style.color = "#474d59";
          }, 1000);
        }

        // if a location to be changed is not selected yet
        // show the error
        if ($scope.locationToBeSaved === "") {
          // do a text color transition to show error
          document.getElementById("chooseLocationToChange").style.color = "red";

          $timeout(function () {
            document.getElementById("chooseLocationToChange").style.color = "#474d59";
          }, 1000);
        }
      }
    };

    // chooses city to be edited
    // also changes cities text colors
    // function call can be found in addNewLocationToFollow.html
    $scope.changeCityToFollow = function (cityToFollow) {
      // save the database property to be added to location
      $scope.propertyToSendToDatabase = cityToFollow;

      // change the text colors of the cities to follow
      // when the user clicks them
      switch (cityToFollow) {
        case "extraCityToFollow0":
          // var passed from addNewLocationToFollow.html
          // to be used to update database in the above
          // saveLocationToFollow function
          $scope.locationToBeSaved = $scope.citiesToFollow[0];

          document.getElementById("extraCityToFollow0").style.color = "#6D00A2";
          document.getElementById("extraCityToFollow1").style.color = "#F2B200";
          document.getElementById("extraCityToFollow2").style.color = "#F2B200";
          break;
        case "extraCityToFollow1":
          // var passed from addNewLocationToFollow.html
          // to be used to update database in the above
          // saveLocationToFollow function
          $scope.locationToBeSaved = $scope.citiesToFollow[1];

          document.getElementById("extraCityToFollow1").style.color = "#6D00A2";
          document.getElementById("extraCityToFollow0").style.color = "#F2B200";
          document.getElementById("extraCityToFollow2").style.color = "#F2B200";
          break;
        case "extraCityToFollow2":
          // var passed from addNewLocationToFollow.html
          // to be used to update database in the above
          // saveLocationToFollow function
          $scope.locationToBeSaved = $scope.citiesToFollow[2];

          document.getElementById("extraCityToFollow2").style.color = "#6D00A2";
          document.getElementById("extraCityToFollow1").style.color = "#F2B200";
          document.getElementById("extraCityToFollow0").style.color = "#F2B200";
          break;
      }
    };

    // $scope.removeCityToFollow = function (cityToFollow) {
    //   var cityToSaveInfo = {
    //     location: {},
    //   };

    //   // change the text colors of the cities to follow
    //   // when the user clicks them
    //   switch (cityToFollow) {
    //     case "extraCityToFollow0":
    //       // add all necessary circle info to the users database
    //       cityToSaveInfo.location["extraCityToFollow0"] = {
    //         // below cityName comes from geocoder after search
    //         // is done and the map is finished moved
    //         cityName: "add new",
    //         // bbox: {},
    //         // center: {},
    //       };
    //       // // var passed from addNewLocationToFollow.html
    //       // // to be used to update database in the above
    //       // // saveLocationToFollow function
    //       // $scope.locationToBeSaved = $scope.citiesToFollow[0];

    //       // document.getElementById("extraCityToFollow0").style.color = "#6D00A2";
    //       // document.getElementById("extraCityToFollow1").style.color = "#F2B200";
    //       // document.getElementById("extraCityToFollow2").style.color = "#F2B200";
    //       break;
    //     case "extraCityToFollow1":
    //       // var passed from addNewLocationToFollow.html
    //       // to be used to update database in the above
    //       // saveLocationToFollow function
    //       $scope.locationToBeSaved = $scope.citiesToFollow[1];

    //       document.getElementById("extraCityToFollow1").style.color = "#6D00A2";
    //       document.getElementById("extraCityToFollow0").style.color = "#F2B200";
    //       document.getElementById("extraCityToFollow2").style.color = "#F2B200";
    //       break;
    //     case "extraCityToFollow2":
    //       // var passed from addNewLocationToFollow.html
    //       // to be used to update database in the above
    //       // saveLocationToFollow function
    //       $scope.locationToBeSaved = $scope.citiesToFollow[2];

    //       document.getElementById("extraCityToFollow2").style.color = "#6D00A2";
    //       document.getElementById("extraCityToFollow1").style.color = "#F2B200";
    //       document.getElementById("extraCityToFollow0").style.color = "#F2B200";
    //       break;
    //   }
    //   // update the user
    //   UserService.updateUser($rootScope.current_user, cityToSaveInfo).then(
    //     function (data) {
    //       // reload the user data so the correct
    //       // cities name will appear
    //       $scope.loadUserData();

    //       // close the modal automatically
    //       // $scope.modalInstance.close();

    //       // reload the dashboards map to the new cities coordinates
    //       DashboardMapService.reloadMap($scope.locationToBeSaved, $scope);

    //       // set var back to empty for next time
    //       $scope.locationToBeSaved = "";
    //     },
    //     function () {
    //       console.log("Update failed!");
    //     },
    //   );
    // };

    $scope.switchCity = function (cityClicked) {
      if (cityClicked === "add new") {
        $scope.addNewLocationToFollow();
      } else {
        DashboardMapService.reloadMap(cityClicked, $scope);
      }
    };

    // this function will only show my friends' status updates
    $scope.showOnlyFriendsUpdates = function () {
      $scope.mapStatusesOnlyShown = false;
      $scope.friendsStatusesOnlyShown = true;
      $scope.allStatusUpdates = [];
      $scope.propertyName = "time";

      // gets all statuses
      StatusUpdatesService.getAllStatusUpdates().then(
        function (statuses) {
          if (statuses.length > 0) {
            for (var i = 0; i < statuses.length; i++) {
              if (statuses[i].status.length > 0) {
                for (var j = 0; j < statuses[i].status.length; j++) {
                  $scope.allStatusUpdates.push(statuses[i].status[j]);
                }
              }
            }
          }

          // filters for all statuses created by me
          function checkMe(user) {
            return user.from === $rootScope.sess._id;
          }

          // filters for all statuses created by my friends
          function checkFriends(user) {
            for (var i = 0; i < $scope.myFriends.friends.length; i++) {
              if (user.from === $scope.myFriends.friends[i]._id) {
                return user;
              }
            }
          }

          // filtering
          var array = $scope.allStatusUpdates.filter(checkFriends);

          // filtering
          var array2 = $scope.allStatusUpdates.filter(checkMe);

          // concat both above arrays together and puts it in $scope.allStatusUpdates
          $scope.allStatusUpdates = array.concat(array2);

          // orderBy function is an angular filter that orders item in array, in this case, by time of status
          $scope.allStatusUpdates = orderBy($scope.allStatusUpdates, $scope.propertyName, $scope.reverse);

          // get user's full name and profile pic
          $scope.getUserName("statuses");
        },
        function (err) {
          console.log("status load err: ", err);
        },
      );
    };

    // this function shows status updates only from users in map area
    $scope.showOnlyUsersInMapUpdates = function (users) {
      console.log("showOnlyUsersInMapUpdates");

      $scope.friendsStatusesOnlyShown = false;
      $scope.mapStatusesOnlyShown = true;
      $scope.allStatusUpdates = [];
      $scope.propertyName = "time";

      // the users variable may be empty here because this function is called when clicked on 'MAP' in the dashboard,
      // which is different from when the dashboard is first initiated since that's when the map is loaded, and so are
      // the users in the map area, which are used here. But $scope.usersInMap holds users in map area.
      if (!users) {
        users = $scope.usersInMap;
      }

      // get all statuses
      StatusUpdatesService.getAllStatusUpdates().then(
        function (statuses) {
          if (statuses.length > 0) {
            for (var i = 0; i < statuses.length; i++) {
              if (statuses[i].status.length > 0) {
                for (var j = 0; j < statuses[i].status.length; j++) {
                  $scope.allStatusUpdates.push(statuses[i].status[j]);
                }
              }
            }
          }

          // filters for statuses created by use in map area
          function checkForStatusesInMap(status) {
            for (var i = 0; i < users.length; i++) {
              if (status.from == users[i]._id) {
                return status;
              }
            }
          }

          // filtering

          // console.log($scope.allStatusUpdates);
          $scope.allStatusUpdates = $scope.allStatusUpdates.filter(checkForStatusesInMap);

          // order statuses by time in reverse
          $scope.allStatusUpdates = orderBy($scope.allStatusUpdates, $scope.propertyName, $scope.reverse);

          // get user's full name and profile pic
          $scope.getUserName("statuses");

          //console.log($scope.allStatusUpdates);
        },
        function (err) {
          console.log("status load err: ", err);
        },
      );
    };

    $scope.removeStatus = function (status) {
      StatusUpdatesService.deleteStatus(status._id, status.from).then(function (result) {
        if (!result.success) {
          console.log("status load err: ", result);
          return;
        }

        $scope.allStatusUpdates = $scope.allStatusUpdates.filter(function (el) {
          return el._id !== status._id;
        });

        socket.emit("delete-status", {
          _id: status._id,
        });
      });
    };

    $scope.removeReply = function (reply, status) {
      StatusUpdatesService.deleteReply(reply._id, status._id).then(function (result) {
        if (!result.success) {
          console.log("status load err: ", result);
          return;
        }

        var targetStatus = $scope.allStatusUpdates.filter(function (oStatus) {
          return oStatus._id == status._id;
        })[0];

        targetStatus.replies = targetStatus.replies.filter(function (el) {
          return el._id !== reply._id;
        });

        socket.emit("delete-reply", {
          status_id: status._id,
          reply_id: reply._id,
        });
      });
    };

    $scope.handleKeyDown = function (event, statusId) {
      if (statusId) {
        $("#hidden-comment-" + statusId).val(event.target.value);
      } else {
        $("#status-hidden-input").val(event.target.value);
      }
    };

    // create new status
    $scope.newStatus = function (event, msg) {
      msg = $("#status-hidden-input").val();
      if (msg == "" && !$scope.upload) {
        console.log("nothing was typed");
      } else {
        $scope.status = {
          user: $rootScope.sess._id,
          message: {
            status_type: "text",
            message: msg,
          },
        };

        var timeOfStatus = Date.now();

        var data = {
          status_type: $scope.status.message.status_type,
          time: timeOfStatus,
          from: $scope.status.user,
          userFullname: $rootScope.sess.fname + " " + $rootScope.sess.lname,
          likes: [],
          profilePic: $rootScope.sess.profile_pic,
        };

        if ($scope.upload) {
          data.status_type = $scope.upload.type;
          data.filename = $scope.upload.src;
          data.caption = $scope.status.message.message;
        } else {
          data.message = $scope.status.message.message;
        }

        // send new status-update to database through service
        StatusUpdatesService.postNewStatus(data).then(function (result) {
          // add new status update to local array to show immediately
          $scope.allStatusUpdates.unshift({
            _id: result.status[0]._id,
            message: result.status[0].message,
            caption: result.status[0].caption,
            status_type: result.status[0].status_type,
            time: result.status[0].time,
            from: result.status[0].from,
            userFullname: $rootScope.sess.fname + " " + $rootScope.sess.lname,
            likes: result.status[0].likes,
            profilePic: $rootScope.sess.profile_pic,
          });

          // broadcast new status update to other users and to save to database
          socket.emit("new-status-update", {
            _id: result.status[0]._id,
            message: result.status[0].message,
            caption: result.status[0].caption,
            status_type: result.status[0].status_type,
            time: result.status[0].time,
            from: result.status[0].from,
            userFullname: $rootScope.sess.fname + " " + $rootScope.sess.lname,
            likes: result.status[0].likes,
            profilePic: $rootScope.sess.profile_pic,
          });
        });

        event.target.value = "";
        $scope.status.message = {};
        $scope.upload = null;
        $("#status-hidden-input").val("");
      }
    };

    // create new status
    $scope.newReply = function (event, status, msg) {
      msg = $("#hidden-comment-" + status._id).val();
      if (event.which === 13) {
        if (msg == "") {
          console.log("nothing was typed");
        } else {
          var timeOfStatus = Date.now();

          var data = {
            status_id: status._id,
            message: msg,
            reply_type: "text",
            time: timeOfStatus,
            from: $rootScope.sess._id,
            userFullname: $rootScope.sess.fname + " " + $rootScope.sess.lname,
            profilePic: $rootScope.sess.profile_pic,
            caption: "",
            _id: null,
          };

          socket.emit("add-reply", data);

          event.target.value = "";
          $scope.status.reply = {};
          $("#hidden-comment-" + status._id).val("");
        }
      }
    };

    // add a like to a status or remove a like
    $scope.addLikeToStatusOrReply = function (status, reply) {
      var isStatusLike = true;
      var inStatusLikeList = false;
      var likesList = status.likes;

      var data = {
        status: status._id,
        me: $rootScope.sess._id,
        createdBy: status.from,
        type: "status",
      };
      if (reply) {
        isStatusLike = false;
        data.reply = reply;
        data.type = "comment";
        likesList = reply.likes;
      }

      // iterate through likes array to check if user has already liked event
      // if user is in array, inList variable will be equal to true, else false
      if (likesList && likesList.length > 0) {
        for (var i = 0; i < likesList.length; i++) {
          if (data.me === likesList[i].from) {
            inStatusLikeList = true;
            //if user is found, iteration will stop
            break;
          }
        }

        // if user is in the list of likes, user will be removed from list
        if (inStatusLikeList) {
          if (isStatusLike) {
            // here we find the index of the event in the $scope.myEvents array
            var a = $scope.allStatusUpdates
              .map(function (x) {
                return x._id;
              })
              .indexOf(data.status);

            // here we find the index of the user in the $scope.myEvents[a].likes array
            var likesIndex = $scope.allStatusUpdates[a].likes
              .map(function (y) {
                return y.from;
              })
              .indexOf(data.me);

            // with both of those indexes we can now update the local $scope.myEvents.likes array, which will affect
            // immediately the number of likes displayed
            $scope.allStatusUpdates[a].likes.splice(likesIndex, likesIndex + 1);
          } else {
            // here we find the index of the event in the $scope.myEvents array
            var a = $scope.allStatusUpdates
              .map(function (x) {
                return x._id;
              })
              .indexOf(data.status);

            // index found
            var r = $scope.allStatusUpdates[a].replies
              .map(function (x) {
                return x._id;
              })
              .indexOf(reply._id);

            // here we find the index of the user in the $scope.myEvents[a].likes array
            var likesIndex = $scope.allStatusUpdates[a].replies[r].likes
              .map(function (y) {
                return y.from;
              })
              .indexOf(data.me);

            $scope.allStatusUpdates[a].replies[r].likes.splice(likesIndex, likesIndex + 1);
          }

          // but database also needs to be updated, here
          socket.emit("remove-status-like", data);
          return;
        }
      }

      // index found
      var c = $scope.allStatusUpdates
        .map(function (x) {
          return x._id;
        })
        .indexOf(data.status);

      // local array updated

      if (isStatusLike) {
        $scope.allStatusUpdates[c].likes.push({ from: data.me, date: Date.now() });
      } else {
        // index found
        var d = $scope.allStatusUpdates[c].replies
          .map(function (x) {
            return x._id;
          })
          .indexOf(reply._id);

        if (!$scope.allStatusUpdates[c].replies[d].likes) {
          $scope.allStatusUpdates[c].replies[d].likes = [];
        }
        $scope.allStatusUpdates[c].replies[d].likes.push({ from: data.me, date: Date.now() });
      }

      // database updated
      socket.emit("add-status-like", data);
    };

    // this function handles the file, uploads file to s3 bucket and creates new status in DB
    $scope.handleImageFileSelect = function (evt) {
      var file = evt.currentTarget.files[0];
      if (!file) {
        return alert("Please choose a file to upload first.");
      }

      var albumName = "status-updates";
      var timeOfMessage = Date.now();

      // data to send to database
      var data = {
        message: $scope.status.message.message,
        status_type: "image",
        time: timeOfMessage,
        from: $rootScope.sess._id,
      };

      // send new status-update to database through service
      SaveDataToS3Bucket.saveImageToBucket(file, albumName, data).then(function (response) {
        if (response.Location) {
          $scope.upload = {
            src: response.Location,
            type: response.type,
            mimeType: response.mimeType,
          };
        }
      });
    };

    $scope.init();
  },
]);
