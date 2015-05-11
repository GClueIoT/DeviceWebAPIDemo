(function () {
  'use strict';

  var isStarting = false;
  var hrState = 0;

  function getHeartRateState(heartRate) {
    if (heartRate < 60) {
      return 1;
    } else if (heartRate < 90) {
      return 2;
    } else if (heartRate < 120) {
      return 3;
    } else {
      return 4;
    }
  }

  function registerHeartRate($scope, client, device) {
    client.addEventListener({
      "method": "PUT",
      "profile": "health",
      "attribute": "heartrate",
      "serviceId": device.id,
      "params": {},
      "onevent": function(event) {
        var json = JSON.parse(event);
        var state = getHeartRateState(json.heartRate);
        if (state != hrState) {
          hrState = state;
          $scope.heart_image = "./img/heartrate/HeartBeat" + state + ".png";
        }
        $scope.heartrate = json.heartRate;
        $scope.$apply();
      },
      "onsuccess": function() {
        isStarting = true;
        $scope.button = "停止";
        $scope.$apply();
      },
      "onerror": function(errorCode, errorMessage) {
        alert("onerror: " + errorCode + " " + errorMessage);
      }
    });
  }

  function unregisterHeartRate($scope, client, device) {
    client.removeEventListener({
      "method": "DELETE",
      "profile": "health",
      "attribute": "heartrate",
      "serviceId": device.id,
      "params": {},
      "onsuccess": function() {
        isStarting = false;
        $scope.button = "開始";
        $scope.$apply();
      },
      "onerror": function(errorCode, errorMessage) {
        isStarting = false;
      }
    });
  }

  function clickHeartRate($scope, client, device) {
    if (isStarting) {
      unregisterHeartRate($scope, client, device);
    } else {
      registerHeartRate($scope, client, device);
    }
  }

  function showErrorDialog($modal) {
    var modalInstance = $modal.open({
      templateUrl: 'error-dialog-heartrate-select.html',
      controller: 'ModalInstanceCtrl',
      size: 'lg',
      resolve: {
        'title': function() {
          return 'エラー';
        },
        'message': function() {
          return 'デバイスが選択されていません。';
        }
      }
    });
    modalInstance.result.then(function (result) {
    });
  }

  var HeartRateController = function ($scope, $modal, $window, $location, demoWebClient, deviceService) {
    var device = undefined;
    $scope.title = "心拍計";
    $scope.heartrate = "-";
    $scope.button = "開始";
    $scope.heart_image = "./img/heartrate/HeartBeat1.png";
    if (deviceService.devices.length > 0) {
      device = deviceService.devices[0];
      $scope.deviceName = deviceService.devices[0].name;
    } else {
      $scope.deviceName = "デバイス未設定";
    }
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
    }
    $scope.searchHeartRate = function() {
      $location.path('/radio/health');
    }
    $scope.clickHeartRate = function() {
      if (device) {
        clickHeartRate($scope, demoWebClient, device);
      } else {
        showErrorDialog($modal);
      }
    }
  }

  angular.module('demoweb')
    .controller('HeartRateController', 
      ['$scope', '$modal', '$window', '$location', 'demoWebClient', 'deviceService', HeartRateController]);
})();
