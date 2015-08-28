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
   * AngularJSフィルター・コンポーネント
   */
  var filter;

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
   * 色情報をFFFFFF形式の文字列に変換する。
   *
   * @param r 赤色成分(0-255)
   * @param g 緑色成分(0-255)
   * @param b 青色成分(0-255)
   * @returns {String} 色情報
   */
  function createColor(r, g, b) {
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
        sendLightColor(light.serviceId, light.light.lightId, req.selectColor, req.selectBrightness, function () {
          --count;
          if (count == 0) {
            callback();
          }
        });
      } else {
        ++count;
        sendTurnOff(light.serviceId, light.light.lightId, function () {
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
    setLightColor(request, function () {
      requestQueue.splice(0, 1);
      sendStateFlag = false;
      setTimeout(function () {
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
        "brightness": brightness
      },
      "onerror": function (id, errorCode, errorMessage) {
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
        "lightId": lightId
      },
      "onerror": function (id, errorCode, errorMessage) {
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
   * @param $scope スコープ
   * @param isDeviceOrientation trueであればdeviceorientation、falseであればlightプロファイル。
   */
  function testDialog($scope, isDeviceOrientation) {
    if (isShowDialog) {
      return;
    }
    isShowDialog = true;

    var modalInstance = modalDialog.open({
      templateUrl: 'dialog-service-select.html',
      controller: 'ModalInstanceCtrl2',
      size: 'lg',
      resolve: {
        'isDeviceOrientation': function () {
          return isDeviceOrientation;
        }
      }
    });
    modalInstance.result.then(function (result) {
      isShowDialog = false;
    });
  }

  function filterServices(services, targetScope) {
    return filter('filter')(services, function (value, index, array) {
      return value.scopes.indexOf(targetScope) != -1;
    });
  }

  var AccelerationLightController = function ($scope, $modal, $window, $location, $filter, demoWebClient, deviceService) {
    modalDialog = $modal;
    filter = $filter;
    demoClient = demoWebClient;

    //
    // Strings
    //

    $scope.title = '加速度 + ライト';

    $scope.pairStartText = '開始';

    $scope.pairStopText = '停止';

    $scope.pairRemoveText = '削除';

    $scope.serviceNotSpecifiedText = 'サービスが選択されていません';

    $scope.addPairText = '追加';

//    if (!setLightDevices($scope, lightService.lights)) {
//      discoverLights($scope, $location, lightService);
//    }

    // Navigation bar
    $scope.settingAll = function () {
      demoClient.discoverPlugins({
        onsuccess: function (plugins) {
          $scope.$apply(function () {
            $location.path('/settings/acceleration_light');
          });
        },

        onerror: function (errorCode, errorMessage) {
          $scope.$apply(function () {
            $location.path('/error/' + errorCode);
          });
        }
      });
    };

    $scope.pairs = [new Pair('aaa')];

    $scope.discoverLight = function () {
      $location.path('/light/select');
    };
    $scope.addPair = function () {
      turnOnLights(false);
    };
    $scope.back = function () {
      $location.path('/');
    };

    $scope.testDialog = function (scope, isDeviceOrientation) {
      testDialog(scope, isDeviceOrientation);
    }
  };

  //
  // ##########################################################################################
  //      Classes
  // ##########################################################################################
  //

  //
  // ------------------------------------------------------------------------------------------
  //      Private
  // ------------------------------------------------------------------------------------------
  //

  var Pair;
  (function () {

    var _privateStore = {
      eventState: 'stopped'
    };

    // Constructor
    Pair = function (name) {
      _privateStore._name = name;
    };

    /**
     * ペアのリストからこのペアを削除する。
     * @param {Array} list ペアのリスト
     */
    Pair.prototype.removePair = function (list) {
      var index = list.indexOf(this);
      if (index != -1) {
        list.splice(index, 1);
      }
    };

    Pair.prototype.getName = function () {
      return _privateStore._name;
    };

    Pair.prototype.setName = function (name) {
      _privateStore._name = name;
    };

    Pair.prototype.getDeviceOrientationService = function () {
      return typeof _privateStore._deviceOrientationService !== 'undefined' ?
        _privateStore._deviceOrientationService : null;
    };

    Pair.prototype.setDeviceOrientationService = function (service) {
      _privateStore._deviceOrientationService = service;
    };

    Pair.prototype.getLightService = function () {
      return typeof _privateStore._lightService !== 'undefined' ?
        _privateStore._lightService : null;
    };

    Pair.prototype.setLightService = function (service) {
      _privateStore._lightService = service;
    };

    /**
     * ペアの加速度とライト連携を開始する。
     */
    Pair.prototype.start = function () {

    };

    /**
     * ペアの加速度とライト連携を停止する。
     */
    Pair.prototype.stop = function () {

    };

    Pair.prototype.activateDeviceOrientationEvent = function () {
      if (typeof _privateStore._deviceOrientationService === 'undefined' ||
        _privateStore._eventState == 'registering' || _privateStore._eventState == 'unregistering') {
        return;
      }
      _privateStore._eventState = 'registering';
      demoClient.addEventListener({
        "method": "PUT",
        "profile": "deviceorientation",
        "attribute": "ondeviceorientation",
        "serviceId": _privateStore._deviceOrientationService.id,
        "params": {},
        "onevent": function (event) {
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
        "onsuccess": function () {
          _privateStore._eventState = 'started';
          $scope.$apply();
        },
        "onerror": function (errorCode, errorMessage) {
          //pairState.eventState = 'stopped';
          showErrorDialog($modal, '加速度イベントの配信開始に失敗しました');
        }
      });
    };

    Pair.prototype.deactivateDeviceOrientationEvent = function () {
      if (_privateStore._eventState == 'registering' || _privateStore._eventState == 'unregistering') {
        return;
      }
      _privateStore._eventState = 'unregistering';
      demoClient.removeEventListener({
        "method": "DELETE",
        "profile": "deviceorientation",
        "attribute": "ondeviceorientation",
        "serviceId": _privateStore._deviceOrientationService.id,
        "params": {},
        "onsuccess": function () {
          pairState.eventState = 'stopped';
          $scope.$apply();
        },
        "onerror": function (errorCode, errorMessage) {
          //pairState.eventState = STATE_NONE;
        }
      });
    };

    /**
     * @return {Boolean} イベント配信中のときはtrue、そうでなければfalse
     */
    Pair.prototype.isDeviceOrientationEventActive = function () {
      return typeof _privateStore._eventState !== 'undefined' && _privateStore._eventState == 'started';
    };

    /**
     * 加速度イベントを取得してからライトに対する更新リクエストをリクエストキューに追加するまでに要する最低限インターバルを設定する。
     * @param {Number} interval インターバル（ミリ秒）
     */
    Pair.prototype.setMinimumUpdateInterval = function (interval) {

    };

  })();

  //
  // ##########################################################################################
  //      Modules
  // ##########################################################################################
  //

  angular.module('demoweb')
    .controller('AccelerationLightController',
    ['$scope', '$modal', '$window', '$location', '$filter', 'demoWebClient', 'deviceService', AccelerationLightController]);

  angular.module('demoweb').controller('ModalInstanceCtrl2', function ($scope, $modalInstance, isDeviceOrientation) {
    $scope.title = isDeviceOrientation ?
      'DeviceOrientationサービス' : 'Lightサービス';
    $scope.message = 'サービスを選択してください';
    $scope.getServices = function () {
      return filterServices(demoClient.lastKnownDevices,
        isDeviceOrientation ? 'deviceorientation' : 'light');
    };
    $scope.refresh = function () {
      demoClient.discoverDevices({
        onsuccess: function (services) {
          $scope.service = filterServices(services,
            isDeviceOrientation ?
              'deviceorientation' : 'light');
          $scope.$apply();
        },
        onerror: function () {
          // エラー表示させる
        }
      });
    };
    $scope.refreshText = '再検索';
    $scope.emptyText = 'サービスが見つかりませんでした';
    $scope.ok = function () {
      $modalInstance.close(true);
    };
    $scope.cancel = function () {
//      $modalInstance.dismiss('cancel');
      $modalInstance.close(false);
    };
  });

})();
