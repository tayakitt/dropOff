'use strict';

angular.module('dropOff.makeTrip', ['ngRoute', 'firebase', 'ngSanitize', 'ui.select'])

.controller('makeTripCtrl', ['$scope', 'CommonProp', '$location', '$firebaseArray',
 'seatCalc', '$firebaseObject', '$q',
 function($scope, CommonProp, $location, $firebaseArray, seatCalc, $firebaseObject, $q){
  $scope.username = CommonProp.getUser();
  $scope.userType = CommonProp.getPermission();
  $scope.success = false;
  $scope.hasProfile = true;

  if(!$scope.username && $scope.userType != "driver"){
    $location.path('/login');
  }

  var uid = CommonProp.getUID();
  var driverRef = firebase.database().ref('drivers');
  driverRef.once("value")
  .then(function(snapshot) {
      $scope.hasProfile = snapshot.hasChild(uid); // true
    });


  var locationRef = firebase.database().ref().child('locations');
  $scope.locations = $firebaseArray(locationRef);

    // Transform the custon location entry
    $scope.tagTransform = function(newTag){
      var item = {
        name: newTag
      };
      return item;
    }

    $scope.trip = {};
    var tripRef = firebase.database().ref().child('trips');
    $scope.trips = $firebaseArray(tripRef);

    $scope.createTrip = function(){
      $scope.trip.seats = seatCalc.getTripSeats($scope.seats);
      $scope.trip.driver = CommonProp.getUID();

      $scope.trip.datetime = moment($scope.datetime, "MMM DD yyyy HH:mm").valueOf();
      $scope.trips.$add(
        $scope.trip
        ).then(function(ref){
          $q.all([
            findLocation($scope.trip.startLoc),
            findLocation($scope.trip.endLoc)
            ]).then(function(success){
              showSuccess();
            });
          })
      }

      function findLocation(location){
        var defered = $q.defer();

        locationRef.orderByChild("name").equalTo(location).once("value")
        .then(function(snapshot){
          var isLocation = snapshot.exists();

          if(!isLocation){
            $scope.locations.$add({
              name: location
            }).then(function(success){
              defered.resolve(success);
            }, function(error){
              console.log(error);
              defered.reject(error);
            });
            return defered.promise;
          }
        });
      }

      function showSuccess(){
        $scope.success = true;
        window.setTimeout(function(){
          $scope.$apply(function(){
            $scope.success = false;
          });
        }, 2000);
      }

      $scope.obj = [
      [{
        col: 1,
        row: 1,
        isAvailable: false,
        isSeat: false,
        takenBy: false,
        span: 50,
        align: "center",
        name: "A"
      }, {
        col: 2,
        row: 1,
        isAvailable: false,
        isSeat: true,
        takenBy: false,
        span: 50,
        align: "left",
        name: "B"
      }],
      [{
        col: 1,
        row: 2,
        isAvailable: false,
        isSeat: true,
        takenBy: false,
        span: 33.33,
        align: "left",
        name: "C"
      }, {
        col: 2,
        row: 2,
        isAvailable: false,
        isSeat: true,
        takenBy: false,
        span: 33.33,
        align: "left",
        name: "D"
      }, {
        col: 3,
        row: 2,
        isAvailable: false,
        isSeat: true,
        takenBy: false,
        span: 33.33,
        align: "left",
        name: "E"
      }]
      ];
      $scope.isDisabled = false;
      $scope.seats = $scope.obj;
    // $scope.rowLetter = seatCalc.rowStack($scope.obj);
    // $scope.seatCount = 0;
    
    $scope.clickSeat = function(seat) {
      if (seat.isSeat && !$scope.isDisabled) {
        if (seat.isAvailable) {
          seat.isAvailable = false;
          // $scope.seatCount--;
        } else {
          seat.isAvailable = true;
          // $scope.seatCount++;
        }
      }
    }

    $scope.logout = function(){
      CommonProp.logoutUser();
    };
  }])

.service('seatCalc', function() {
  var rowLetter = [];

  this.rowStack = function(obj) {
    for (var i = 0, j = 65; i < obj.length; i++, j++) {
      rowLetter.push(String.fromCharCode(j));
    }
    return rowLetter;
  }

  this.getTripSeats = function(seats) {
    var tripSeats = [];

    for (var row = 0; row < seats.length; row++){
      for (var col = 0; col < seats[row].length; col++){
        var currentSeat = seats[row][col];
        if (currentSeat.isSeat && currentSeat.isAvailable){
          var seatInfo = {
            col: currentSeat.col,
            isAvailable: currentSeat.isAvailable,
            isSeat: currentSeat.isSeat,
            row: currentSeat.row,
            takenBy: currentSeat.takenBy
          };
          tripSeats.push(seatInfo);
        }
      }
    }

    return tripSeats;
  }
});