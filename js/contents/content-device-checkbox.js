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

  function searchDevicesWithProfile(devices, profileName, callback) {
    var list = [];
    for (var i = 0; i < devices.length; i++) {
      if (profileName === undefined || devices[i].scopes.lastIndexOf(profileName) >= 0) {
        list.push(devices[i]);
      }
    }
    callback(list);
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

  var DeviceListController = function ($scope, $window, $routeParams, $location, demoWebClient, deviceService) {
    var profileName = $routeParams.profileName;

    searchDevices(demoWebClient, profileName, function(devices) {
      $scope.list = {
        'name'  : 'デバイス一覧',
        'devices' : devices
      }
      $scope.$apply();

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
    $scope.registerAll = function() {
      $('input[name=list-checkbox]').prop("checked", true);
    }
    $scope.unregisterAll = function() {
      $('input[name=list-checkbox]').prop("checked", false);
    }
    $scope.cancel = function() {
      $window.history.back();
    }
    $scope.ok = function() {
      var $checked = $('[name=list-checkbox]:checked');
      if ($checked.length == 0) {
      } else {
        deviceService.removeAll();
        var $checkbox = $('[name=list-checkbox]');
        var valList = $checkbox.map(function(index, el) {
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
    .controller('DeviceListController', 
      ['$scope', '$window', '$routeParams', '$location', 'demoWebClient', 'deviceService', DeviceListController]);
})();
