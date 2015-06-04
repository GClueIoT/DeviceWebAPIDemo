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

  function layout() {
    
  }
  var RemoteController = function ($scope, $modal, $window, $location, $compile, demoWebClient, deviceService) {
    var devices = deviceService.list('remote').devices;

    if (devices && devices.length > 0) {
      commandList = store.get(devices[0].id);
      if (commandList == undefined) {
        commandList = [];
      }
    }

    $scope.title = devices[0].name;
    var size = commandList.length < 8 ? 4 : Math.ceil(commandList.length / 2);
    var index = 0;
    for (var i = 0; i < size; i++) {
      var t = '<tr>';
      for (var j = 0; j < 2; j++) {
        if (index < commandList.length) {
          t += '<td class="demo" ng-click="sendCommand(' + index+ ')">';
          t += '<img class="logo" src="img/Appli_remocon.png">';
          t += '<span class="demo-name">' + commandList[index].name + '</span>';
          t += '</td>';
        } else {
          t += '<td class="nodemo"></td>';
        }
        index++;
      }
      t += '</tr>';
      $('.demo-list').append($compile(t)($scope));
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
    $scope.shiftCommandList = function() {
      $location.path('/remote/command');
    }
    $scope.sendCommand = function(index) {
      sendCommand(demoWebClient, devices[0], commandList[index].message);
    }
  };

  angular.module('demoweb')
    .controller('RemoteController', 
      ['$scope', '$modal', '$window', '$location', '$compile', 'demoWebClient', 'deviceService', RemoteController]);
})();
