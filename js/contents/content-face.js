(function () {
  'use strict';

  var isStarting = false;

  var _width = 320;
  var _height = 320;

  function onExpression(face) {
    drawFace({
      x: _width * face.x,
      y: _height * face.y,
      width: 100,
      height: 100,
      expression: face.expressionResults.expression
    });
  }

  function drawFace(opt) {
    var canvas = $('#face-area').get(0);
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.src = 'img/face/' + opt.expression + '.png';
    ctx.clearRect(0, 0, _width, _height);
    ctx.drawImage(img, opt.x, opt.y, opt.width, opt.height);
  }

  function registerFace($scope, client, device) {
    client.addEventListener({
      profile: "humandetect",
      attribute: "onfacedetection",
      serviceId: device.id,
      params: {
        options: ["expression"],
        expressionThreshold: 0
      },
      onevent: function(json) {
        var i, face;
        var event = JSON.parse(json);
        console.log("event: ", event);
        if (event.faceDetects) {
          console.log("results: ", event.faceDetects);

          for (i = 0; i < event.faceDetects.length; i++) {
            face = event.faceDetects[i];
            if (face.expressionResults) {
              var exp = face.expressionResults.expression;
              console.log("expression: " + exp);
              if (exp) {
                onExpression(face);
              }
            } else {
              console.log("no expressionResults");
            }
          }
        } else {
          console.log("no faceDetects");
        }
      },
      onsuccess: function() {
        console.log("onsuccess");
        isStarting = true;
      },
      onerror: function(errorCode, errorMessage) {
        console.log("onerror: " + errorCode + " " + errorMessage);
      }
    });
  }

  function unregisterFace($scope, client, device) {
    client.removeEventListener({
      profile: "humandetect",
      attribute: "onfacedetection",
      serviceId: device.id,
      onsuccess: function() {
        console.log("onsuccess");
        isStarting = false;
      },
      onerror: function(errorCode, errorMessage) {
        console.log("onerror: " + errorCode + " " + errorMessage);
      }
    });
  }

  function clickFace($scope, client, device) {
    if (isStarting) {
      unregisterFace($scope, client, device);
    } else {
      registerFace($scope, client, device);
    }
  }

  var FaceController = function ($scope, $modal, $window, $location, demoWebClient, deviceService) {
    var device = undefined;
    $scope.title = "表情認識";
    $scope.button = "開始";
    if (deviceService.devices.length > 0) {
      device = deviceService.devices[0];
      $scope.deviceName = deviceService.devices[0].name;
    } else {
      $scope.deviceName = "デバイス未設定";
    }
    $scope.settingAll = function() {
      demoWebClient.discoverPlugins({
        onsuccess: function(plugins) {
          $scope.$apply(function() {
            $location.path('/settings/face');
          });
        },
        onerror: function(errorCode, errorMessage) {
          $scope.$apply(function() {
            $location.path('/error/' + errorCode);
          });
        }
      });
    };
    $scope.back = function() {
      $location.path('/');
    };
    $scope.searchFace = function() {
      $location.path('/radio/humandetect');
    };
    $scope.clickFace = function() {
      if (device) {
        clickFace($scope, demoWebClient, device);
      }
    };
  };

  angular.module('demoweb')
    .controller('FaceController', 
      ['$scope', '$modal', '$window', '$location', 'demoWebClient', 'deviceService', FaceController]);
})();
