(function () {
  'use strict';

  var commandList = [];

  function saveCommandList() {
    
  }

  function addCommand(name, command) {
    commandList.push({name: name, command: command});
  }

  function removeCommand(name) {
    for (var i = 0; i < commandList.length; i++) {
      if (commandList[i].name === name) {
        commandList.splice(i, 1);
        saveCommandList();
        return;
      }
    }
  }

  function getCommand(name) {
    for (var i = 0; i < commandList.length; i++) {
      if (commandList[i].name === name) {
        return commandList[i].command;
      }
    }
    return null;
  }

  function sendCommand(client, service, command) {
    client.request({
      "method": "POST",
      "profile": "remote_controller",
      "serviceId": service.id,
      "params": {
        "message": command
      },
      "onsuccess": function() {
      },
      "onerror": function(errorCode, errorMessage) {
      }
    });
  }

  var RemoteController = function ($scope, $modal, $window, $location, demoWebClient, deviceService) {
    var devices = deviceService.list('remote').devices;
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
      sendCommand(demoWebClient, list[i], commandList[index].command);
    }
    $scope.removeCommand = function(index) {
    }
  };

  angular.module('demoweb')
    .controller('RemoteController', 
      ['$scope', '$modal', '$window', '$location', 'demoWebClient', 'deviceService', RemoteController]);
})();
