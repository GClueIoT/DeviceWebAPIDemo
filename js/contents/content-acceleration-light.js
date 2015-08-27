(function () {
  'use strict';

  /**
   * キュー上に保持できるリクエスト上限。
   */
  var MAX_REQUEST_QUEUE = 10;
  
  /**
   * ライトを操作するリクエストを格納するキュー。
   */
  var requestQueue = [];
  
  /**
   * Device Web API Managerにアクセスするためのインスタンス。
   */
  var demoClient;

  /**
   * ダイアログ。
   */
  var modalDialog;

  /**
   * 操作を行うライト一覧。
   */
  var lightList = [];

  /**
   * ライトの電源状態.
   */
  var lightPower = false;

  /**
   * 送信状態を保持する。
   * <ul>
   * <li> true: 送信中
   * <li> false: 待機中
   * </ul>
   */
  var sendStateFlag = false;

  /**
   * 指定されたxy座標の色を取得する。
   * 
   * @param x x座標
   * @param y y座標
   * @returns {String} 色データ (FFFFFF形式)
   */
  function getColor(x, y) {
    return "FFFFFF";
  }

  /**
   * 色情報をFFFFFF形式の文字列に変換する。
   * 
   * @param r 赤色成分(0-255)
   * @param g 緑色成分(0-255)
   * @param b 青色成分(0-255)
   * @returns {String} 色情報
   */
  function convertColor(r, g, b) {
    return convert10To16(r) + convert10To16(g) + convert10To16(b);
  }

  /**
   * 10進数を16進数に変換する。
   * <p>
   * 16以下の場合には、先頭に0をつける。
   * </p>
   * @param value 10進数の数値
   * @returns {String} 16進数の値
   */
  function convert10To16(value) {
    if (value < 16) {
      return "0" + value.toString(16);
    } else {
      return value.toString(16);
    }
  }

  /**
   * ライトの命令を追加する。
   * 
   * @param power 電源 (true: 点灯、false: 消灯)
   * @param color 色データ (FFFFFF形式)
   * @param brightness 明度 (0-100)
   */
  function addLightCommand(power, color, brightness) {
    if (!checkLights() || sendStateFlag) {
      return;
    }
    sendStateFlag = true;

    addRequest({
      power: power,
      selectColor: color,
      selectBrightness: brightness
    });
  }

  /**
   * ライトの色を設定する。
   * 
   * @param req リクエスト
   * @param callback コールバック
   */
  function setLightColor(req, callback) {
    var count = 0;
    for (var i = 0; i < lightList.length; ++i) {
      var light = lightList[i];
      if (req.power) {
        ++count;
        sendLightColor(light.serviceId, light.light.lightId, req.selectColor, req.selectBrightness, function() {
          --count;
          if (count == 0) {
            callback();
          }
        });
      } else {
        ++count;
        sendTurnOff(light.serviceId, light.light.lightId, function() {
          --count;
          if (count == 0) {
            callback();
          }
        });
      }
    }
  }

  /**
   * リクエストを追加する。
   * 
   * 上限数を超えるリクエストが溜まっている場合には最初のリクエストから削除する。
   * 
   * @param request リクエスト
   */
  function addRequest(request) {
    requestQueue.push(request);
    if (requestQueue.length == 1) {
      sendRequest();
    } else if (requestQueue.length > MAX_REQUEST_QUEUE) {
      requestQueue.splice(0, 1);
    }
  }

  /**
   * リクエストを順番に送信する。
   */
  function sendRequest() {
    if (requestQueue.length == 0) {
      return;
    }

    var request = requestQueue[0];
    setLightColor(request, function() {
      requestQueue.splice(0, 1);
      sendStateFlag = false;
      setTimeout(function() {
        sendRequest();
      }, 400);
    });
  }

  /**
   * ライトの色指定する命令を送信する。
   * @param serviceId サービスID
   * @param lightId ライトID
   * @param color 色指定(#FFFFFF形式)
   * @param brightness ブライトネス(0.0 - 1.0)
   * @param callback コールバック
   * @returns
   */
  function sendLightColor(serviceId, lightId, color, brightness, callback) {
    demoClient.request({
      "method": "POST",
      "profile": "light",
      "devices": [serviceId],
      "params": {
        "lightId": lightId,
        "color": color,
        "brightness": brightness,
      },
      "onerror": function(id, errorCode, errorMessage) {
        showErrorDialogWebAPI();
      },
      "oncomplete": callback
    });
  }

  /**
   * 消灯の命令を送信する。
   * 
   * @param serviceId サービスID
   * @param lightId ライトID
   * @returns
   */
  function sendTurnOff(serviceId, lightId, callback) {
    demoClient.request({
      "method": "DELETE",
      "profile": "light",
      "devices": [serviceId],
      "params": {
        "lightId": lightId,
      },
      "onerror": function(id, errorCode, errorMessage) {
        showErrorDialogWebAPI();
      },
      "oncomplete": callback
    });
  }

  /**
   * ライトを点灯する。
   * 
   * @param force trueの場合は強制的に点灯する
   */
  function turnOnLights(force) {
    if (!checkLights()) {
      showErrorDialogNoLights();
      return;
    }

    if (!lightPower || force) {
      lightPower = true;
      sendStateFlag = false;
      addLightCommand(true);
    }
  }

  /**
   * ライトを消灯する。
   * 
   * @param force trueの場合は強制的に消灯する
   */
  function turnOffLights(force) {
    if (lightPower || force) {
      lightPower = false;
      sendStateFlag = false;
      addLightCommand(false);
    }
  }

  /**
   * ライトが設定されているか確認する。
   * 
   * @return ライトが設定されている場合はtrue、それ以外はfalse
   */
  function checkLights() {
    return (lightList && lightList.length > 0);
  }

  /**
   * 通信エラーを通知するダイアログを表示する。
   */
  function showErrorDialogWebAPI() {
    showErrorDialog('エラー', '通信に失敗しました。');
  }

  /**
   * ライトが設定されていないことを通知するダイアログを表示する。
   */
  function showErrorDialogNoLights() {
    showErrorDialog('エラー', 'ライトが設定されていません。');
  }

  var isShowDialog = false;

  /**
   * エラーダイアログを表示する。
   * 
   * @param title ダイアログのタイトル
   */
  function testDialog(title) {
    if (isShowDialog) {
      return;
    }
    isShowDialog = true;

    var modalInstance = modalDialog.open({
      templateUrl: 'dialog-service-select.html',
      controller: 'ModalInstanceCtrl2',
      size: 'lg',
      resolve: {
        'title': function() {
          return title;
        },
        'message': function() {
          return 'サービスを選択してください';
        },
        'services': function() {
//          demoWeb.discoverDevices({
//            onsuccess:function(services) {
//            },
//            onerror:function() {
//            });
          var arr = [];
          for (var i = 0; i < 15; ++i) {
            arr.push({name:i});
          }
          return arr;
        },
        'emptyText': function() {
          return 'サービスが見つかりませんでした';
        }
      }
    });
    modalInstance.result.then(function (result) {
      isShowDialog = false;
    });
  }

  /**
   * ライトの設定を画面に設定する。
   * 
   * @param $scope スコープ
   * @param lights ライト一覧
   */
  function setLightDevices($scope, lights) {
    lightList = lights;
    if (lightList.length == 1) {
      $scope.deviceName = lightList[0].name;
      turnOnLights(true)
      return true;
    } else if (lightList.length > 1) {
      $scope.deviceName = lightList[0].name + " その他 (" + (lightList.length - 1) + ")";
      turnOnLights(true)
      return true;
    } else {
      return false;
    }
  }

  /**
   * ライトを検索して登録する。
   */
  function discoverLights($scope, $location, lightService) {
    lightService.discover(demoClient, {
      oncomplete: function(lights) {
        if (setLightDevices($scope, lights)) {
          $scope.$apply();
        }
      },
      onerror: function(errorCode, errorMessage) {
        $location.path('/error/' + errorCode);
      }
    });
  }
  
  function registerDeviceOrientation($scope, client, device) {
    moniteringState = STATE_REGISTER;
    client.addEventListener({
      "method": "PUT",
      "profile": "deviceorientation",
      "attribute": "ondeviceorientation ",
      "serviceId": device.id,
      "params": {},
      "onevent": function(event) {
        var json = JSON.parse(event);
        var params = calcLightParamsFromAcceleration(json.orientation.acceleration);
//        var state = getHeartRateState(json.heartRate);
//        if (state != hrState) {
//          hrState = state;
//          $scope.heart_image = "./img/heartrate/HeartBeat" + state + ".png";
//        }
//        $scope.heartrate = json.heartRate;
        $scope.$apply();
      },
      "onsuccess": function() {
        moniteringState = STATE_START;
        hrState = -1;
        $scope.button = "停止";
        $scope.$apply();
      },
      "onerror": function(errorCode, errorMessage) {
        moniteringState = STATE_NONE;
        showErrorDialog($modal, '心拍数の取得開始に失敗しました。');
      }
    });
  }

  function unregisterDeviceOrientation($scope, client, device) {
    moniteringState = STATE_UNREGISTER;
    client.removeEventListener({
      "method": "DELETE",
      "profile": "deviceorientation",
      "attribute": "ondeviceorientation ",
      "serviceId": device.id,
      "params": {},
      "onsuccess": function() {
        moniteringState = STATE_NONE;
        $scope.button = "開始";
        $scope.$apply();
      },
      "onerror": function(errorCode, errorMessage) {
        moniteringState = STATE_NONE;
      }
    });
  }

  var AccelerationLightController = function ($scope, $modal, $window, $location, deviceService, demoWebClient, lightService) {
    demoClient = demoWebClient;
    modalDialog = $modal;

    $scope.title = '加速度 + ライト';

//    if (!setLightDevices($scope, lightService.lights)) {
//      discoverLights($scope, $location, lightService);
//    }

    $scope.addPairText = '追加';
    $scope.settingAll = function() {
      demoClient.discoverPlugins({
        onsuccess: function(plugins) {
          $scope.$apply(function() {
            $location.path('/settings/acceleration_light');
          });
        },

        onerror: function(errorCode, errorMessage) {
          $scope.$apply(function() {
            $location.path('/error/' + errorCode);
          });
        }
      });
    }
    $scope.discoverLight = function() {
      $location.path('/light/select');
    }
    $scope.addPair = function() {
      turnOnLights(false);
    }
    $scope.back = function() {
      $location.path('/');
    };
    
    $scope.testDialog = function(title) {
      testDialog(title);
    }
  };

  angular.module('demoweb')
    .controller('AccelerationLightController', 
      ['$scope', '$modal', '$window', '$location', 'deviceService', 'lightService', AccelerationLightController]);
  
  angular.module('demoweb').controller('ModalInstanceCtrl2', function ($scope, $modalInstance, title, message, services, emptyText) {
    $scope.title = title;
    $scope.message = message;
    $scope.services = services;
    $scope.emptyText = emptyText;
    $scope.ok = function () {
      $modalInstance.close(true);
    };
    $scope.cancel = function() {
      $modalInstance.close(false);
    };
  });

})();
