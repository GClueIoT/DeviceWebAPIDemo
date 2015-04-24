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

  var SelectLightController = function($scope) {
    discoverLight($scope);

    $scope.registerAll = function() {
      alert("registerAll");
    }
    $scope.unregisterAll = function() {
      alert("unregisterAll");
    }
    $scope.cancel = function() {
      alert("cancel");
    }
    $scope.ok = function() {
      alert("ok");
    }
  };

  angular.module('demoweb')
    .controller('SelectLightController', ['$scope', '$location', SelectLightController]);
})();
