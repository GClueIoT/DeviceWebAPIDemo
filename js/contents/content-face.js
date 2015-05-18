(function () {
  'use strict';

  var isStarting = false;

  var _areaWidth;
  var _areaHeight;

  var _expressions = ['mad', 'sad', 'smile', 'surprise', 'unknown'];
  var _icons = [];
  var _promptMessage = '開始ボタンを押してください。';

  function getErrorMessage(errorCode) {
    switch (errorCode) {
    case dConnect.constants.ErrorCode.NOT_FOUND_SERVICE:
      return '指定されたデバイスを発見できませんでした。';
    default:
      return '表情認識の実行に失敗しました。';
    }
  }

  function showError($modal, message) {
    $modal.open({
      templateUrl: 'error-dialog-face.html',
      controller: 'ModalInstanceCtrl',
      size: 'lg',
      resolve: {
        'title': function() {
          return 'エラー';
        },
        'message': function() {
          return message;
        }
      }
    });
  }

  function showProgress($modal, message, callback) {
    callback = callback || {};
    callback.onshow = callback.onshow || function() {};
    callback.onclose = callback.onclose || function() {}; 

    var modalInstance = $modal.open({
      templateUrl: 'progress.html',
      controller: 'ProgressInstanceCtrl',
      size: 'lg',
      backdrop: 'static',
      resolve: {
        'title': function() {
          return '待機中';
        },
        'message': function() {
          return message;
        }
      }
    });
    modalInstance.result.then(function () {
      callback.onclose();
    }, function() {
      callback.onclose();
    });
    callback.onshow(modalInstance);
    return modalInstance;
  }

  function showExpressions(faces) {
    var canvas = $('#face-area').get(0);
    var ctx = canvas.getContext('2d');

    for (var i = 0; i < faces.length; i++) {
      var face = faces[i];
      var faceWidth = _areaWidth * face.width;
      drawFace(ctx, {
        x: _areaWidth * face.x - faceWidth / 2,
        y: _areaHeight * face.y - faceWidth / 2,
        width: faceWidth,
        height: faceWidth,
        expression: face.expressionResults.expression
      });
    }
  }

  function resetCanvas(message) {
    var canvas = $('#face-area').get(0);
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, _areaWidth, _areaHeight);
    if (message) {
      ctx.textAlign = 'center';
      ctx.fillText(message, _areaWidth / 2, _areaHeight / 2);
    }
  }

  function getExpressionName(exp) {
    for (var i = 0; i < _expressions.length; i++) {
      if (exp === _expressions[i]) {
        return exp;
      }
    }
    return 'unknown';
  }

  function drawFace(ctx, opt) {
    console.log('drawFace: {x:' + opt.x + ', y:' + opt.y + ', expression:"' + opt.expression + '", width:' + opt.width + ', height:' + opt.height + '}');
    
    var expName = getExpressionName(opt.expression);
    ctx.drawImage(_icons[expName], opt.x, opt.y, opt.width, opt.height);
  }

  function registerFace($scope, $modal, client, device) {
    var modalInstance;

    client.addEventListener({
      profile: "humandetect",
      attribute: "onfacedetection",
      serviceId: device.id,
      params: {
        threshold: 0.2,
        expressionThreshold: 0.2,
        options: ["expression"]
      },
      onevent: function(json) {
        var i, face;
        var event = JSON.parse(json);
        console.log("event: ", event);
        if (event.faceDetects) {
          console.log("results: ", event.faceDetects);

          var array = [];
          for (i = 0; i < event.faceDetects.length; i++) {
            face = event.faceDetects[i];
            if (face.expressionResults) {
              var exp = face.expressionResults.expression;
              if (exp) {
                array.push(face);
              }
            } else {
              console.log("no expressionResults");
            }
          }
          if (array.length > 0) {
            modalInstance.close();
            showExpressions(array);
          }
        } else {
          console.log("no faceDetects");
        }
      },
      onsuccess: function() {
        console.log("onsuccess");
        resetCanvas();

        isStarting = true;
        modalInstance = showProgress($modal, 'デバイスからの応答を待っています...', {
          onclose: function() {
            isStarting = false;
            unregisterFace($scope, client, device);
          }
        });
      },
      onerror: function(errorCode, errorMessage) {
        console.log("onerror: " + errorCode + " " + errorMessage);
        showError($modal, getErrorMessage(errorCode));
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

  function clickFace($scope, $modal, client, device) {
    if (isStarting) {
      unregisterFace($scope, client, device);
    } else {
      registerFace($scope, $modal, client, device);
    }
  }

  function loadIcons(callback) {
    var i, 
        img,
        expName,
        count = 0;

    callback = callback || {};
    callback.onload = callback.onload || function() {};
    callback.onerror = callback.onerror || function() {};

    for (i = 0; i < _expressions.length; i++) {
      expName = _expressions[i];
      img = new Image();
      img.src = 'img/face/' + expName + '.png';
      img.onload = function() {
        if (isLoadedAll()) {
          callback.onload();
        }
      };
      img.onerror = function() {
        callback.onerror();
      };
      _icons[expName] = img;
    }
    function isLoadedAll() {
      return (++count) >= _expressions.length;
    }
  }

  var FaceController = function ($scope, $modal, $window, $location, demoWebClient, deviceService) {

    var device = undefined,
        list = deviceService.list('face');
    $scope.title = "表情認識";
    $scope.button = "開始";
    if (list.devices.length > 0) {
      device = list.devices[0];
      $scope.deviceName = list.devices[0].name;
    } else {
      $scope.deviceName = "デバイス未設定";
    }

    _areaWidth = 0.9 * $($window).width();
    _areaHeight = (3 / 4) * _areaWidth;
    var canvas = $('#face-area').get(0);
    canvas.width = _areaWidth;
    canvas.height = _areaHeight;
    resetCanvas(_promptMessage);

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
      $location.path('/radio/face/humandetect');
    };
    $scope.clickFace = function() {
      if (device) {
        clickFace($scope, $modal, demoWebClient, device);
      } else {
        showError($modal, 'デバイスが選択されていません。');
      }
    };

    loadIcons({
      onerror: function() {
        showError($modal, '画像の読み込みに失敗しました。');
      }
    });
  };

  angular.module('demoweb')
    .controller('FaceController', 
      ['$scope', '$modal', '$window', '$location', 'demoWebClient', 'deviceService', FaceController]);
})();
