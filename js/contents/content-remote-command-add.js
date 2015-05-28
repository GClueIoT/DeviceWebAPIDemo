(function () {
  'use strict';

  var commandList = [];

  function saveCommandList() {
    
  }

  function addCommand(name, message) {
    commandList.push({name: name, message: message});
  }

  function getCommand(client, service) {
    client.request({
      "method": "GET",
      "profile": "remote_controller",
      "devices": [service.id],
      "params": {},
      "onsuccess": function(id, json) {
        $("#commandMessage").val(json.message);
      },
      "onerror": function(errorCode, errorMessage) {
      }
    });
  }

  function openErrorDialog(title, message) {
    
  }

  var RemoteCommandAddController = function ($scope, $modal, $window, $location, demoWebClient, deviceService) {
    var devices = deviceService.list('remote').devices;
    $scope.title = 'コマンド追加';
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
      $location.path('/remote/controller');
    };
    $scope.getCommand = function() {
      getCommand(demoWebClient, devices[0]);
    }
    $scope.saveCommand = function() {
      var name = $("#commandName").val();
      if (name.length == 0) {
        openErrorDialog('エラー', 'コマンド名が入力されていません。');
        return;
      }

      var message = $("#commandMessage").val();
      if (message.length == 0) {
        openErrorDialog('エラー', 'コマンドメッセージが入力されていません。<br>GETボタンを押下して取得してください。');
        return;
      }

      addCommand(name, message);
      saveCommandList();
    }
  };

  angular.module('demoweb')
    .controller('RemoteCommandAddController', 
      ['$scope', '$modal', '$window', '$location', 'demoWebClient', 'deviceService', RemoteCommandAddController]);
})();
