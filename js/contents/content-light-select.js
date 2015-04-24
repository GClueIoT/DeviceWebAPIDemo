(function () {
  'use strict';

  var demoClient;

  function containLightService(lights, serviceId, lightId) {
    for (var i = 0; i < lights.length; i++) {
      var light = lights[i];
      if (light.serviceId === serviceId && light.light.lightId == lightId) {
        return true;
      }
    }
    return false;
  }
  
  function discoverLight($scope, lightService) {
    var devices = demoClient.getLastKnownDevices();
    var serviceIds = [];
    for (var i = 0; i < devices.length; i++) {
      serviceIds.push(devices[i].id);
    }

    // 発見したライトを格納するマップ
    var lightMap = {};

    demoClient.request({
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
            var checked = false;
            if (containLightService(lightService.lights, serviceId, light.lightId)) {
              checked = true;
            }
            lightIds.push({
              'name': light.name,
              'serviceId': serviceId,
              'light': light,
              'checked': checked
            });
          }
        }

        $scope.list = {
          'name'  : 'Light一覧',
          'lights' : lightIds
        }
        $scope.$apply();
        var $checkboxs = $('[name=light-checkbox]');
        $checkboxs.map(function(index, el) {
          el.checked = lightIds[index].checked;
        });
      }
    });
  }

  var SelectLightController = function($scope, $location, demoWebClient, lightService) {
    demoClient = demoWebClient;

    $scope.title = '使用するライトを選択してください';
    discoverLight($scope, lightService);

    $scope.settingAll = function() {
      $location.path('/settings');
    }
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
      lightService.removeAll();
      var $checked = $('[name=light-checkbox]');
      var valList = $checked.map(function(index, el) {
        if (el.checked) {
          lightService.addLight($scope.list.lights[index]);
        }
        return $scope.list.lights[index];
      });
      $location.path('/light');
    }
  };

  angular.module('demoweb')
    .controller('SelectLightController', 
      ['$scope', '$location', 'demoWebClient', 'lightService', SelectLightController]);
})();
