(function () {
  'use strict';

  var commandList = [];

  function saveCommandList(service) {
    store.set(service.id, commandList);
  }

  function sendCommand(client, service, command) {
    client.request({
      "method": "POST",
      "profile": "remote_controller",
      "devices": [service.id],
      "params": {
        "message": command
      },
      "onsuccess": function(id, json) {
      },
      "onerror": function(errorCode, errorMessage) {
      }
    });
  }

  var RemoteController = function ($scope, $modal, $window, $location, demoWebClient, deviceService) {
    var devices = deviceService.list('remote').devices;

    if (devices && devices.length > 0) {
      commandList = store.get(devices[0].id);
    }

    $scope.title = devices[0].name;
    $scope.list = {
      'commands' : commandList
    }
    $scope.settingAll = function() {
      demoWebClient.discoverPlugins({
        onsuccess: function(plugins) {
          $scope.$apply(function() {
            $location.path('/settings/remote');
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
      $location.path('/remote');
    };
    $scope.addCommand = function() {
      $location.path('/remote/add');
    }
    $scope.sendCommand = function(index) {
      sendCommand(demoWebClient, devices[0], commandList[index].message);
    }
  };

  angular.module('demoweb')
    .controller('RemoteController', 
      ['$scope', '$modal', '$window', '$location', 'demoWebClient', 'deviceService', RemoteController]);
})();
