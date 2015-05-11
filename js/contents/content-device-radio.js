(function () {
  'use strict';

  function discoverDevices(client, callback) {
    client.discoverDevices({
      onsuccess: function(services) {
        callback(services);
      },
      onerror: function(errorCode, errorMessage) {
        callback([]);
      }
    })
  }

  function searchDevices(client, profileName, callback) {
    discoverDevices(client, function(devices) {
      callback(getDevicesWithProfile(devices, profileName));
    });
  }

  function getDevicesWithProfile(devices, profileName) {
    var list = [];
    for (var i = 0; i < devices.length; i++) {
      if (profileName === undefined || devices[i].scopes.lastIndexOf(profileName) >= 0) {
        list.push(devices[i]);
      }
    }
    return list;
  }

  function showErrorDialog($modal, $location) {
    var modalInstance = $modal.open({
      templateUrl: 'error-dialog-device-radio.html',
      controller: 'ModalInstanceCtrl',
      size: 'lg',
      resolve: {
        'title': function() {
          return 'エラー';
        },
        'message': function() {
          return 'デバイスが接続されていません。設定画面を開きますか？';
        }
      }
    });
    modalInstance.result.then(function (result) {
      if (result) {
        $location.path('/settings');
      }
    });
  }

  var DeviceRadioController = function ($scope, $modal, $window, $routeParams, $location, demoWebClient, deviceService) {
    var profileName = $routeParams.profileName;

    searchDevices(demoWebClient, profileName, function(devices) {
      if (devices.length == 0) {
        showErrorDialog($modal, $location);
      } else {
        $scope.list = {
          'name'  : 'デバイス一覧',
          'devices' : devices
        }
        $scope.$apply();

        setTimeout(function() {
          var $radio = $('[name=list-radio]');
          $radio.map(function(index, el) {
            if (index == 0) {
              el.checked = true;
            }
          });
        }, 100);
      }
    });

    $scope.title = "デバイス選択";
    $scope.settingAll = function() {
      demoWebClient.discoverPlugins({
        onsuccess: function(plugins) {
          $scope.$apply(function() {
            $location.path('/settings');
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
      $window.history.back();
    };
    $scope.cancel = function() {
      $window.history.back();
    }
    $scope.ok = function() {
      var $checked = $('[name=list-radio]:checked');
      if ($checked.length == 0) {
        showErrorDialog($modal, $location);
      } else {
        deviceService.removeAll();
        var $radio = $('[name=list-radio]');
        var valList = $radio.map(function(index, el) {
          if (el.checked) {
            deviceService.addDevice($scope.list.devices[index]);
          }
          return $scope.list.devices[index];
        });
        $window.history.back();
      }
    }
  }

  angular.module('demoweb')
    .controller('DeviceRadioController', 
      ['$scope', '$modal', '$window', '$routeParams', '$location', 'demoWebClient', 'deviceService', DeviceRadioController]);
})();
