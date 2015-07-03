(function () {
  'use strict';

  function appendPhoto($scope, $compile, uri) {
    var children = $('#photos').children('img');
    if (children.length >= 5) {
      children[0].remove();
    }
    $('#photos').append($compile('<img class="photo" ng-click="showPhoto(\'' + uri + '\')" crossorigin="anonymous" src="' + uri + '">')($scope));
  }

  function takePhoto($modal, client, serviceId, callback) {
    client.request({
      "method": "POST",
      "profile": "mediastream_recording",
      "attribute": "takephoto",
      "devices": [serviceId],
      "params": {},
      "onsuccess" : function(id, json) {
        var uri = json.uri;
        if (client.getHost() != 'localhost') {
          uri = uri.replace('localhost', client.getHost());
        }
        callback(uri);
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
        var uri = json.uri;
        if (client.getHost() != 'localhost') {
          uri = uri.replace('localhost', client.getHost());
        }
        $('#camera-preview').attr({'src': uri});
      },
      "onerror": function(id, errorCode, errorMessage) {
        showErrorDialog($modal, 'エラー', 'errorCode=' + errorCode 
            + ' errorMessage=' + errorMessage);
      }
    });
  }

  function stopPreview(client, serviceId) {
    client.request({
      "method": "DELETE",
      "profile": "mediastream_recording",
      "attribute": "preview",
      "devices": [serviceId],
      "params": {},
      "onsuccess" : function(id, json) {
      },
      "onerror": function(id, errorCode, errorMessage) {
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
          return title;
        },
        'message': function() {
          return message;
        }
      }
    });
    modalInstance.result.then(function (result) {});
  }

  var CameraController = function ($scope, $rootScope, $modal, $window, $location, $compile, demoWebClient, deviceService) {
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
        takePhoto($modal, demoWebClient, list.devices[0].id, function(uri) {
          appendPhoto($scope, $compile, uri);
        });
      } else {
        showErrorDialog($modal, 'エラー', 'デバイスが選択されていません。');
      }
    }
    $scope.showPhoto = function(uri) {
      showPhoto($modal, uri);
    }
    $scope.$on('$routeChangeStart', function(ev, current){
      if (list.devices.length > 0) {
        device = list.devices[0];
        stopPreview(demoWebClient, list.devices[0].id);
      }
    });
  }

  angular.module('demoweb')
    .controller('CameraController', 
      ['$scope', '$rootScope', '$modal', '$window', '$location', '$compile', 'demoWebClient', 'deviceService', CameraController]);
})();
