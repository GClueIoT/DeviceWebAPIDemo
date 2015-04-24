(function () {
  'use strict';

  function discoverLight($scope) {
    var devices = _client.getLastKnownDevices();
    var serviceIds = [];
    for (var i = 0; i < devices.length; i++) {
      serviceIds.push(devices[i].id);
    }

    // 発見したライトを格納するマップ
    var lightMap = {};

    _client.request({
      "method": "GET",
      "profile": "light",
      "devices": serviceIds,
      "onsuccess": function(id, json) {
        if (json.lights) {
          lightMap[id] = [];
          for (var i = 0; i < json.lights.length; i++) {
            lightMap[id].push(json.lights[i]);
          }
        }
      },
      "onerror": function(id, error) {
      },
      "oncomplete": function() {
        var lightIds = [];
        for (var serviceId in lightMap) {
          var lights = lightMap[serviceId];
          for (var i in lights) {
            var light = lights[i];
            lightIds.push({
              'name': light.name,
              'serviceId': serviceId,
              'light': light
            });
          }
        }

        $scope.list = {
          'name'  : 'Light一覧',
          'lights' : lightIds
        }
        $scope.$apply();
      }
    });
  }

  var SelectLightController = function($scope, $location, lightData) {
    $scope.title = '使用するライトを選択してください';
    discoverLight($scope);

    $scope.registerAll = function() {
      $('input[name=light-checkbox]').prop("checked", true);
    }
    $scope.unregisterAll = function() {
      $('input[name=light-checkbox]').prop("checked", false);
    }
    $scope.cancel = function() {
      $location.path('/light');
    }
    $scope.ok = function() {
      lightData.removeAll();
      var $checked = $('[name=light-checkbox]:checked');
      var valList = $checked.map(function(index, el) {
        lightData.addLight($scope.list.lights[index]);
        return $scope.list.lights[index];
      });
      $location.path('/light');
    }
  };

  app.controller('SelectLightController', 
      ['$scope', '$location', 'lightData', SelectLightController]);
})();
