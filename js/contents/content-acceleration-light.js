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
   * キューのbusyフラグ。
   * ライトを操作するリクエストがキューに追加された際、即座にリクエストを処理できない場合、trueとなる。
   * @type {boolean}
   */
  var requestQueueBusy = false;

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
   * 送信状態を保持する。
   * <ul>
   * <li> true: 送信中
   * <li> false: 待機中
   * </ul>
   */
  var sendStateFlag = false;

  var isShowDialog = false;

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
   * 加速度データからライトデータを計算する。
   *
   * @param {Object} acceleration 加速度データ
   * @param {Number} acceleration.x x軸方向の加速度
   * @param {Number} acceleration.y y軸方向の加速度
   * @param {Number} acceleration.z z軸方向の加速度
   * @return {Object} ライトデータ
   */
  function calcLightParamsFromAcceleration(acceleration) {
    var MIN_ACCELERATION_VALUE = 2.0;
    var MAX_ACCELERATION_VALUE = 20.0;
    var r = Math.floor(Math.min(Math.max(Math.abs(acceleration.x), MIN_ACCELERATION_VALUE), MAX_ACCELERATION_VALUE) * 255.0 / MAX_ACCELERATION_VALUE);
    var g = Math.floor(Math.min(Math.max(Math.abs(acceleration.y), MIN_ACCELERATION_VALUE), MAX_ACCELERATION_VALUE) * 255.0 / MAX_ACCELERATION_VALUE);
    var b = Math.floor(Math.min(Math.max(Math.abs(acceleration.z), MIN_ACCELERATION_VALUE), MAX_ACCELERATION_VALUE) * 255.0 / MAX_ACCELERATION_VALUE);
    var color = createColor(r, g, b);
    var brightness = Math.max(r, g, b) / 255.0;
    return {
      color: color,
      brightness: brightness
    };
  }

  /**
   * エラーダイアログを表示する。
   *
   * @param title ダイアログのタイトル
   * @param message ダイアログのメッセージ
   */
  function showErrorDialog(title, message) {
    if (isShowDialog) {
      return;
    }
    isShowDialog = true;

    var modalInstance = modalDialog.open({
      templateUrl: 'error-dialog-light.html',
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
    modalInstance.result.then(function (result) {
      isShowDialog = false;
    });
  }

  /**
   * エラーダイアログを表示する。
   *
   * @param isDeviceOrientation trueであればdeviceorientation、falseであればlightプロファイル。
   * @param callback コールバック
   */
  function showServiceSelectionDialog(isDeviceOrientation, callback) {
    if (isShowDialog) {
      return;
    }
    isShowDialog = true;

    var modalInstance = modalDialog.open({
      templateUrl: 'dialog-service-select.html',
      controller: 'ModalServiceSelectCtrl',
      size: 'lg',
      resolve: {
        'isDeviceOrientation': function () {
          return isDeviceOrientation;
        }
      }
    });
    modalInstance.result.then(function (result) {
      isShowDialog = false;
      if (result.success) {
        if (callback.onsuccess) {
          callback.onsuccess(result.service);
        }
      } else {
        if (callback.onerror) {
          callback.onerror();
        }
      }
    });
  }

  /**
   * 指定されたサービス群から特定プロファイルをサポートするサービス群を取得する。
   *
   * @param services サービス
   * @param {String} targetProfile プロファイル名
   * @returns {*} 特定プロファイルをサポートするサービス群
   */
  function filterServices(services, targetProfile) {
    return filter('filter')(services, function (value, index, array) {
      return value.scopes.indexOf(targetProfile) != -1;
    });
  }

  /**
   * ライトの命令を追加する。
   *
   * @param serviceId
   * @param power 電源 (true: 点灯、false: 消灯)
   * @param color 色データ (FFFFFF形式)
   * @param brightness 明度 (0-100)
   */
  function addLightCommand(serviceId, power, color, brightness) {
    if (sendStateFlag) {
      return;
    }
    sendStateFlag = true;

    addRequest({
      serviceId: serviceId,
      power: power,
      color: color,
      brightness: brightness
    });
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
    if (requestQueue.length == 1 && !requestQueueBusy) {
      sendRequest();
    } else if (requestQueue.length > MAX_REQUEST_QUEUE) {
      requestQueue.splice(0, 1);

      // DEBUG
      console.log("Queue overflowed");
    }
  }

  /**
   * リクエストを順番に送信する。
   */
  function sendRequest() {
    if (requestQueue.length == 0) {
      requestQueueBusy = false;
      return;
    } else {
      requestQueueBusy = true;
    }

    var request = requestQueue[0];
    sendLightCommand(request, function () {
      requestQueue.splice(0, 1);
      sendStateFlag = false;
      setTimeout(function () {
        sendRequest();
      }, 400);
    });
  }

  /**
   * ライトの色を設定する。
   *
   * @param req リクエスト
   * @param callback コールバック
   */
  function sendLightCommand(req, callback) {
    demoClient.request({
      "method": "GET",
      "profile": "light",
      "devices": [req.serviceId],
      "onsuccess": function (id, json) {
        if (json.lights) {
          var count = json.lights.length;
          for (var i = 0; i < json.lights.length; ++i) {
            var light = json.lights[i];
            if (req.power) {
              sendLightColor(id, light.lightId, req.color, req.brightness, function (result) {
                --count;
                if (count == 0) {
                  callback();
                }
              });
            } else {
              sendLightTurnOff(id, light.lightId, function (result) {
                --count;
                if (count == 0) {
                  callback();
                }
              });
            }
          }
        }
      },
      "onerror": function (id, errorCode, errorMessage) {
        callback();
      }
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
        callback(false);
      },
      "oncomplete": function () {
        callback(true);
      }
    });
  }

  /**
   * 消灯の命令を送信する。
   *
   * @param serviceId サービスID
   * @param lightId ライトID
   * @returns
   */
  function sendLightTurnOff(serviceId, lightId, callback) {
    demoClient.request({
      "method": "DELETE",
      "profile": "light",
      "devices": [serviceId],
      "params": {
        "lightId": lightId
      },
      "onerror": function (id, errorCode, errorMessage) {
        callback(false);
      },
      "oncomplete": function () {
        callback(true);
      }
    });
  }

  /**
   * 同期的にDeviceOrientationイベントを取得する。
   *
   * @param serviceId サービスID
   */
  function sendDeviceOrientationGet(serviceId, callback) {
    demoClient.request({
      "method": "GET",
      "profile": "deviceorientation",
      "attribute": "ondeviceorientation",
      "devices": [serviceId],
      "onerror": function (id, errorCode, errorMessage) {
        callback.onerror();
      },
      "onsuccess": function (id, json) {
        callback.onsuccess(id, json);
      }
    });
  }

  //
  // ##########################################################################################
  //      Classes
  // ##########################################################################################
  //

  var Pair = function (name) {
    this.name = name;
    this.deviceOrientationService = null;
    this.lightService = null;
    this.interval = 0.5;
    this.status = 'stopped';
  };

  //
  // ##########################################################################################
  //      Controllers
  // ##########################################################################################
  //

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

    $scope.pairs = [new Pair(null)];

    $scope.discoverLight = function () {
      $location.path('/light/select');
    };
    $scope.addPair = function () {
      $scope.pairs.push(new Pair(null));
    };
    $scope.back = function () {
      $location.path('/');
    };

  };
  angular.module('demoweb')
    .controller('AccelerationLightController',
    ['$scope', '$modal', '$window', '$location', '$filter', 'demoWebClient', 'deviceService', AccelerationLightController]);


  angular.module('demoweb')
    .controller('PairController',
    ['$scope', function ($scope) {

      var lastTime = Date.now();

      //
      // Functions
      //

      $scope.$on("$destroy", function handler() {
        $scope.deactivatePair()
      });

      $scope.init = function (pair) {
        $scope.pair = pair;

        $scope.$watch('pairStatus', function (newValue, oldValue) {
          if (newValue == 'started') {
            $scope.pairActive = true;
          } else if (newValue == 'stopped') {
            $scope.pairActive = false;
          }
        });

        $scope.pairName = pair.name;
        $scope.deviceOrientationService = pair.deviceOrientationService;
        $scope.lightService = pair.lightService;
        $scope.pairStatus = pair.status;
        $scope.pairInterval = pair.interval;
      };

      /**
       * ペアの加速度とライト連携を開始する。
       */
      $scope.activatePair = function () {
        console.log("activatePair");
        activateDeviceOrientationEvent();
      };

      /**
       * ペアの加速度とライト連携を停止する。
       */
      $scope.deactivatePair = function () {
        console.log("deactivatePair");
        deactivateDeviceOrientationEvent();

        // 確実ではないが、キューがあふれて消灯リクエストが削除されないよう、キューが空になるのを待ってからリクエストを追加する。
        var turnoff = function() {
          addLightCommand($scope.lightService.id, false);
        };
        var waitFunc;
        waitFunc = function() {
          setTimeout(function () {
            if (requestQueue.length == 0) {
              turnoff();
            } else {
              waitFunc();
            }
          }, 500);
        };
        waitFunc();
      };

      var activateDeviceOrientationEvent = function () {
        if (typeof $scope.deviceOrientationService === 'undefined' ||
          $scope.pairStatus == 'started' || $scope.pairStatus == 'registering' || $scope.pairStatus == 'unregistering') {
          return;
        }
        $scope.pairStatus = 'registering';
        demoClient.addEventListener({
          "method": "PUT",
          "profile": "deviceorientation",
          "attribute": "ondeviceorientation",
          "serviceId": $scope.deviceOrientationService.id,
          "params": {},
          "onevent": function (event) {
            if (Date.now() - lastTime > $scope.pairInterval * 1000) {
              var json = JSON.parse(event);
              var params = calcLightParamsFromAcceleration(json.orientation.accelerationIncludingGravity);
              addLightCommand($scope.lightService.id, true, params.color, params.brightness);

              lastTime = Date.now();

              //console.log("params: {color:" + params.color + ", brightness:" + params.brightness + "}");
            }
          },
          "onsuccess": function () {
            $scope.pairStatus = 'started';
            $scope.$apply();
          },
          "onerror": function (errorCode, errorMessage) {
            //$scope.pairStatus = 'stopped';
            showErrorDialog($modal, '加速度イベントの配信開始に失敗しました');
          }
        });

        //// DEBUG
        //$scope.pairActive = true;
        //
        //var toggle = true;
        //var run;
        //run = function () {
        //  addLightCommand($scope.lightService.id, toggle, "ff0000", 1);
        //  toggle = !toggle;
        //  setTimeout(run, $scope.pairInterval * 1000.0);
        //};
        //run();

      };

      var deactivateDeviceOrientationEvent = function () {
        if (typeof $scope.deviceOrientationService === 'undefined' ||
          $scope.pairStatus == 'stopped' || $scope.pairStatus == 'registering' || $scope.pairStatus == 'unregistering') {
          return;
        }
        $scope.pairStatus = 'unregistering';
        demoClient.removeEventListener({
          "method": "DELETE",
          "profile": "deviceorientation",
          "attribute": "ondeviceorientation",
          "serviceId": $scope.deviceOrientationService.id,
          "params": {},
          "onsuccess": function () {
            $scope.pairStatus = 'stopped';
            $scope.$apply();
          },
          "onerror": function (errorCode, errorMessage) {
            //$scope.pairStatus = 'stopped';
          }
        });

        //// DEBUG
        //$scope.pairActive = false;
        //addLightCommand($scope.lightService.id, true, "000000", 1);
      };

      $scope.showServiceSelectionDialog = function (isDeviceOrientation) {
        showServiceSelectionDialog(isDeviceOrientation, {
          onsuccess: function (service) {
            if (isDeviceOrientation) {
              $scope.deviceOrientationService = service;
            } else {
              $scope.lightService = service;
            }
          }
        });
      };

      $scope.removePair = function () {
        var index = $scope.$parent.pairs.indexOf($scope.pair);
        if (index != -1) {
          $scope.deactivatePair();
          $scope.$parent.pairs.splice(index, 1);
        }
      };

    }]);


  angular.module('demoweb').controller('ModalServiceSelectCtrl',
    function ($scope, $modalInstance, isDeviceOrientation) {
      $scope.title = isDeviceOrientation ?
        'DeviceOrientationサービス' : 'Lightサービス';
      $scope.message = isDeviceOrientation ? '重力を含めた加速度を取得できるサービスを選択してください' : 'サービスを選択してください';

      var deviceOrientationFiltering = function(services, doApply) {
        var tmpServices = filterServices(services, 'deviceorientation');
        var isAsync = false;
        var result = [];
        var searchFunc;
        searchFunc = function (index) {
          if (index < tmpServices.length) {
            sendDeviceOrientationGet(tmpServices[index].id, {
              onsuccess: function (id, json) {
                var acceleration =
                    json.orientation.accelerationIncludingGravity;
                if (typeof acceleration != "undefined") {
                  // Android Host dirty hack
                  // Android Host device plugin always returns {x:0,y:0,z:0} for acceleration.
                  //if (acceleration.x != 0 || acceleration.y != 0 || acceleration.z != 0) {
                  result.push(tmpServices[index]);
                  //}
                }
                isAsync = true;
                searchFunc(++index);
              },
              onerror: function () {
                isAsync = true;
                searchFunc(++index);
              }
            });
          } else {
            $scope.services = result;
            if (isAsync) {
              $scope.$apply();
            }
          }
        };
        searchFunc(0);
      };

      if (isDeviceOrientation) {
        // 重力を含めた加速度が取得できるサービスの見返す。

        demoClient.discoverDevices({
          onsuccess: function (services) {
            deviceOrientationFiltering(services);
          },
          onerror: function () {
            deviceOrientationFiltering([]);
          }
        });
        //deviceOrientationFiltering(demoClient.lastKnownDevices);
      } else {
        $scope.services = filterServices(demoClient.lastKnownDevices, 'light');
      }

      $scope.refresh = function () {
        demoClient.discoverDevices({
          onsuccess: function (services) {
            if (isDeviceOrientation) {
              // 重力を含めた加速度が取得できるサービスの見返す。

              deviceOrientationFiltering(services);
            } else {
              $scope.services = filterServices(services, 'light');
            }

            $scope.$apply();
          },
          onerror: function () {
            // エラー表示させる
          }
        });
      };
      $scope.refreshText = '再検索';
      $scope.emptyText = 'サービスが見つかりませんでした';
      $scope.ok = function (service) {
        $modalInstance.close({success: true, service: service});
      };
      $scope.cancel = function () {
        $modalInstance.close({success: false});
      };
    });

})();
