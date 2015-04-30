(function () {
  'use strict';

  function clickHeartRate() {
  }

  var HeartRateController = function ($scope, $modal, $window, $location, demoWebClient, deviceService) {
    $scope.title = "心拍計";
    $scope.heartrate = "-";
    $scope.button = "開始";
    $scope.deviceName = "デバイス未設定";
    $scope.settingAll = function() {
      demoWebClient.discoverPlugins({
        onsuccess: function(plugins) {
          $scope.$apply(function() {
            $location.path('/settings/heartrate');
          });
        },
        onerror: function(errorCode, errorMessage) {
          $scope.$apply(function() {
            $location.path('/error/' + errorCode);
          });
        }
      });
    }
    $scope.back = function() {
      $location.path('/');
    };
    $scope.searchHeartRate = function() {
      $location.path('/radio');
    }
    $scope.clickHeartRate = function() {
      clickHeartRate();
    }
  }

  angular.module('demoweb')
    .controller('HeartRateController', 
      ['$scope', '$modal', '$window', '$location', 'demoWebClient', 'deviceService', HeartRateController]);
})();
