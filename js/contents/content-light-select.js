(function () {
  'use strict';

  var demoClient;

  function showErrorDialog($modal) {
    var modalInstance = $modal.open({
      templateUrl: 'error-dialog-light.html',
      controller: 'ModalInstanceCtrl',
      size: 'lg',
      resolve: {
        'title': function() {
          return 'エラー';
        },
        'message': function() {
          return 'ライトが一つも選択されていません。';
        }
      }
    });
    modalInstance.result.then(function () {
    });
  }
  
  function containLightService(lights, serviceId, lightId) {
    for (var i = 0; i < lights.length; i++) {
      var light = lights[i];
      if (light.serviceId === serviceId && light.light.lightId == lightId) {
        return true;
      }
    }
    return false;
  }

  /**
   * ライトを検索して登録する。
   */
  function discoverLights($scope, $location, lightService) {
    var oldLights = lightService.lights;
    lightService.discover(demoClient, {
      oncomplete: function(lights) {
        for (var i = 0; i < lights.length; i++) {
          var obj = lights[i];
          var serviceId = obj.serviceId;
          var lightId = obj.light.lightId;
          obj.checked = containLightService(oldLights, serviceId, lightId);
        }

        $scope.list = {
          'name'  : 'Light一覧',
          'lights' : lights
        }
        $scope.$apply();

        var $checkboxs = $('[name=light-checkbox]');
        $checkboxs.map(function(index, el) {
          el.checked = lights[index].checked;
        });
      },
      onerror: function(errorCode, errorMessage) {
        $location.path('/error/' + errorCode);
      }
    });
  }

  var SelectLightController = function($scope, $modal, $location, demoWebClient, lightService) {
    demoClient = demoWebClient;

    $scope.title = '使用するライトを選択してください';
    discoverLights($scope, $location, lightService);

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
      var $checked = $('[name=light-checkbox]:checked');
      if ($checked.length == 0) {
        showErrorDialog($modal);
      } else {
        lightService.removeAll();
        var $checkbox = $('[name=light-checkbox]');
        var valList = $checkbox.map(function(index, el) {
          if (el.checked) {
            lightService.addLight($scope.list.lights[index]);
          }
          return $scope.list.lights[index];
        });
        $location.path('/light');
      }
    }
  };

  angular.module('demoweb')
    .controller('SelectLightController', 
      ['$scope', '$modal', '$location', 'demoWebClient', 'lightService', SelectLightController]);
})();
