(function () {
  'use strict';

  function appendPhoto(uri) {
    var children = $('#photos').children('img');
    if (children.length >= 5) {
      children[0].remove();
    }
    $('#photos').append('<img class="photo" ng-click="showPhoto(\"' + uri + '\")" crossorigin="anonymous" src="' + uri + '">');
    $scope.$apply();
  }

  function takePhoto($modal, client, serviceId) {
    client.request({
      "method": "POST",
      "profile": "mediastream_recording",
      "attribute": "takephoto",
      "devices": [serviceId],
      "params": {},
      "onsuccess" : function(id, json) {
        appendPhoto(json.uri);
      },
      "onerror": function(id, errorCode, errorMessage) {
        showErrorDialog($modal, 'エラー', 'errorCode=' + errorCode 
            + ' errorMessage=' + errorMessage);
      }
    });
  }

  function startPreview($modal, client, serviceId) {
    client.request({
      "method": "PUT",
      "profile": "mediastream_recording",
      "attribute": "preview",
      "devices": [serviceId],
      "params": {},
      "onsuccess" : function(id, json) {
        $('#camera-preview').attr({'src': json.uri});
      },
      "onerror": function(id, errorCode, errorMessage) {
        showErrorDialog($modal, 'エラー', 'errorCode=' + errorCode 
            + ' errorMessage=' + errorMessage);
      }
    });
  }

  function showPhoto($modal, message) {
    var modalInstance = $modal.open({
      templateUrl: 'dialog-camera.html',
      controller: 'ModalInstanceCtrl',
      size: 'lg',
      resolve: {
        'title': function() {
          return '写真';
        },
        'message': function() {
          return message;
        }
      }
    });
    modalInstance.result.then(function (result) {});
  }

  function showErrorDialog($modal, title, message) {
    var modalInstance = $modal.open({
      templateUrl: 'error-dialog-camera.html',
      controller: 'ModalInstanceCtrl',
      size: 'lg',
      resolve: {
        'title': function() {
          return '写真';
        },
        'message': function() {
          return message;
        }
      }
    });
    modalInstance.result.then(function (result) {});
  }

  var CameraController = function ($scope, $modal, $window, $location, demoWebClient, deviceService) {
    var device = undefined;
    var list = deviceService.list('camera');
    $scope.title = "カメラ撮影";
    if (list.devices.length > 0) {
      device = list.devices[0];
      $scope.deviceName = list.devices[0].name;
      startPreview($modal, demoWebClient, list.devices[0].id);
    } else {
      $scope.deviceName = "デバイス未設定";
    }
    $scope.settingAll = function() {
      demoWebClient.discoverPlugins({
        onsuccess: function(plugins) {
          $scope.$apply(function() {
            $location.path('/settings/camera');
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
      $location.path('/');
    }
    $scope.selectCamera = function() {
      $location.path('/radio/camera/mediastream_recording');
    }
    $scope.takePhoto = function() {
      if (list.devices.length > 0) {
        takePhoto($modal, demoWebClient, list.devices[0].id);
      }
    }
    $scope.showPhoto = function(uri) {
      alert("ABC" + uri);
      showPhoto($modal, uri);
    }
  }

  angular.module('demoweb')
    .controller('CameraController', 
      ['$scope', '$modal', '$window', '$location', 'demoWebClient', 'deviceService', CameraController]);
})();
