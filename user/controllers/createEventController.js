'use strict';

ibouge.controller('CreateEventController', ['$scope', '$rootScope', '$http', '$state', 'step', '$uibModal', 'EventService', 'SocketFactory', 'CreateEventMapService','usSpinnerService', function($scope, $rootScope, $http, $state, step, $uibModal, EventService, SocketFactory, CreateEventMapService, usSpinnerService) {

    //initializing variables
    $scope.step = step;
    $scope.event = {
        createdBy: $rootScope.sess._id,
        img: {
            // files: [],
            isSet: false
        },
        name: '',
        category: '',
        date: '',
        startTimeOfEvent: '',
        endTimeOfEvent: '',
        eventDescription: '',
        coordinates: [],
        address1: '',
        address2: '',
        country: '',
        state: '',
        city: '',
        zip: '',
        // likes: {},
        going: {}
    };
    $scope.isFileSelected = false;
    $scope.imageInfo = {};

    // this is for the calendar popup, it is initialized to false
    $scope.popup1 = {
        opened: false
    };

    // ensures step 2 submit button
    // cannot be pressed until the
    // client has chose an address
    $scope.canSubmit = false;

    // socket listener
    var socket = SocketFactory.connection;

    $scope.init = function() {
        // this adjusts the size of the event-description textarea div to the same size as div to its left when the page is first opened
        var elementHeight = document.getElementsByClassName('left-small-group');

        var secondElement = document.getElementsByClassName('event-description-input');
        secondElement[0].style.height = elementHeight[0].clientHeight;
    };

    // this adjusts the size of the event-description textarea div to the same size as div to its left when the page is first loaded
    window.onload = function () {
        var elementHeight = document.getElementsByClassName('first-form');

        var secondElement = document.getElementsByClassName('event-description-input');
        secondElement[0].style.height = elementHeight[0].clientHeight - 33 + 'px';
    };

    // this adjusts the size of the event-description textarea div to the same size as div to its left when the page is resized
    window.onresize = function () {
        var elementHeight = document.getElementsByClassName('first-form');

        var secondElement = document.getElementsByClassName('event-description-input');

        if (secondElement[0] !== undefined) {

            secondElement[0].style.height = elementHeight[0].clientHeight - 33 + 'px';
        }
    };

    // this opens the calendar-popup
    $scope.open1 = function() {

        $scope.popup1.opened = true;

    };

    // this sets date chosen in the calendar-popup
    $scope.setDate = function(year, month, day) {

        $scope.event.date = new Date(year, month, day);

    };

    // format chosen to display date
    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];

    $scope.format = $scope.formats[3];

    $scope.altInputFormats = ['M!/d!/yyyy'];

    $scope.dateOptions = {
        formatYear: 'yy',
        maxDate: new Date(2100, 1, 1),
        minDate: new Date(),
        startingDay: 0,
        showWeeks: false
    };

    // this function handles the file when selected
    $scope.handleImageFileSelect = function(evt) {

        if (evt.currentTarget.files != null) {
            $scope.event.img.isSet = true;

            //it then created a URL for the image and it sets that url to the tempImgFile to show in
            // the box immediately
            $scope.tempImgFile = URL.createObjectURL(evt.currentTarget.files[0]);
            $scope.$apply();

        } else {
            $scope.event.img.isSet = false;
            return alert('Please choose a file to upload first.');
        }

        // the file itself is being set to $scope.file to the send to the s3 bucket
        $scope.file = evt.currentTarget.files[0];
    };

    // this function is called once the whole form is filled and ready to be sent to the database
    $scope.createEvent = function(isValid) {

        if (isValid && $scope.canSubmit) {

            if ($scope.event.address2 === '') {

                $scope.event.address2 = 'none';

            }

            $scope.event.going = {userGoing: $rootScope.sess._id, confirmationDate: Date.now()};

            var data = $scope.event;

            // this is for the angular-spinner, show div
            $scope.loader = true;
            // start spinning
            usSpinnerService.spin('spinner-1');
            // this service routes you to an http request who saves the eventImage to the s3 bucket and then creates the event
            EventService.createEvent($scope.file, data).then(function(event){

                //write code for in case it breaks

                // hide div and stop spinner
                $scope.loader = false;
                usSpinnerService.stop('spinner-1');
                // this information is being sent to the dashboard ctrl, since the event when created does not show
                // its image in the dashboard, we are manually sending the file name of the event img here
                if (event.eventImage !== '') {
                    $rootScope.$broadcast("event-picture-info", event.eventImage);
                }

                // after the event is created successfully, the user will be re-routed to the dashboard
                $state.go('mydashboard');

            }, function(err) {
                console.log("event could not be created: ", err);
            });
        }
    };

    // this will take the user back to step 1
    $scope.goBackToStepOne = function(){
        $scope.step = 'step1';
    };

    //this will take the user to the next step, step 2
    $scope.goToStepTwo = function(isValid){
        if (isValid){
        $scope.step = 'step2';
        } else {
           $scope.createEventForm.submitted=true;
        }

        // get the element to place the map in
        var mapElement = document.getElementById('event-location-map');

        // send mapElement to service to create and place map in element
        CreateEventMapService.createMap(mapElement, $scope);
    };


    // all these are settings for the uib-timepicker

    // number of hours to increase or decrease
    $scope.hstep = 1;

    // number of minutes to increase or decrease
    $scope.mstep = 1;

    $scope.options = {
        hstep: [1, 2, 3],
        mstep: [1, 5, 10, 15, 25, 30]
    };

    // AM or PM setting
    $scope.ismeridian = true;
    $scope.toggleMode = function() {
        $scope.ismeridian = ! $scope.ismeridian;
    };

    $scope.init();
}]);
