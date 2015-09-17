(function () {
  'use strict';

  /**
   * キュー上に保持できるリクエスト上限。
   */
  var MAX_REQUEST_QUEUE = 50;

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

  var deviceOrientationServices = [];

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
      templateUrl: 'error-dialog.html',
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
   * @param forceAdd 命令が無視されずにキューに追加するようにするフラグ
   */
  function addLightCommand(serviceId, power, color, brightness, forceAdd) {
    if (sendStateFlag && (typeof forceAdd != 'boolean' || !forceAdd)) {
      //console.log("addLightCommand waiting result, ignoring");
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

      console.log("WARNING: Queue overflowed.");
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
              //console.log("" + new Date().now + ": do turn-on: " + requestQueue.length);
              sendLightColor(id, light.lightId, req.color, req.brightness, function (result) {
                --count;
                if (count == 0) {
                  callback();
                }
              });
            } else {
              //console.log("" + new Date().now + ": do turn-off: " + requestQueue.length);
              sendLightTurnOff(id, light.lightId, function (result) {
                //console.log("result: " + result);
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

  var DeviceOrientationService = function (scope, callback) {
    var self = this;

    this.id = scope.deviceOrientationService.id;
    this.pairControllerScopes = [];
    this.addPairControllerScope = function (scopeArg, callbackArg) {
      if (this.pairControllerScopes.indexOf(scopeArg) == -1) {
        if (this.pairControllerScopes.length == 0) {
          activateDeviceOrientationEvent(scopeArg, {
            onsuccess: function () {
              self.pairControllerScopes.push(scopeArg);
              if (typeof callbackArg.onsuccess == 'function') {
                callbackArg.onsuccess();
              }
            },
            onerror: function () {
              if (typeof callbackArg.onerror == 'function') {
                callbackArg.onerror();
              }
            }
          });
        } else {
          if (typeof callbackArg.onsuccess == 'function') {
            callbackArg.onsuccess();
          }
        }
      } else {
        if (typeof callbackArg.onsuccess == 'function') {
          callbackArg.onsuccess();
        }
      }
    };
    var activateDeviceOrientationEvent = function (scopeArg, callbackArg) {
      demoClient.addEventListener({
        "method": "PUT",
        "profile": "deviceorientation",
        "attribute": "ondeviceorientation",
        "serviceId": scopeArg.deviceOrientationService.id,
        "params": {},
        "onevent": function (event) {
          for (var i = 0; i < self.pairControllerScopes.length; ++i) {
            var scopeItr = self.pairControllerScopes[i];
            if (Date.now() - scopeItr.lastTime > scopeItr.pairInterval * 1000 && scopeItr.pairStatus == 'started') {
              var json = JSON.parse(event);
              var params = calcLightParamsFromAcceleration(json.orientation.accelerationIncludingGravity);
              addLightCommand(scopeItr.lightService.id, true, params.color, params.brightness);

              scopeItr.lastTime = Date.now();

              //console.log("params: {color:" + params.color + ", brightness:" + params.brightness + "}");
            }
          }
        },
        "onsuccess": function () {
          if (typeof callbackArg.onsuccess == 'function') {
            callbackArg.onsuccess();
          }
        },
        "onerror": function (errorCode, errorMessage) {
          if (typeof callbackArg.onerror == 'function') {
            callbackArg.onerror();
          }
          showErrorDialog('エラー', '加速度イベントの配信開始に失敗しました');
        }
      });
    };
    this.removePairControllerScope = function (scopeArg, callbackArg) {
      var index = self.pairControllerScopes.indexOf(scopeArg);
      if (index != -1) {
        //console.log('removePairControllerScope scope found');
        if (this.pairControllerScopes.length <= 1) {
          deactivateDeviceOrientationEvent(scopeArg, {
            onsuccess: function () {
              //console.log('removePairControllerScope event unregister success');
              self.pairControllerScopes.splice(index, 1);
              addLightCommand(scopeArg.lightService.id, false, null, null, true);
              if (typeof callbackArg.onsuccess == 'function') {
                callbackArg.onsuccess();
              }
            },
            onerror: function () {
              //console.log('removePairControllerScope event unregister error');
              if (typeof callbackArg.onerror == 'function') {
                callbackArg.onerror();
              }
              showErrorDialog('エラー', '加速度イベントの配信停止に失敗しました');
            }
          });
        } else {
          //console.log('removePairControllerScope unregister not needed');
          if (typeof callbackArg.onsuccess == 'function') {
            callbackArg.onsuccess();
          }
        }
      } else {
        //console.log('removePairControllerScope scope not found');
        this.pairControllerScopes.splice(index, 1);
        if (typeof callbackArg.onsuccess == 'function') {
          callbackArg.onsuccess();
        }
      }
    };
    var deactivateDeviceOrientationEvent = function (scopeArg, callbackArg) {
      demoClient.removeEventListener({
        "method": "DELETE",
        "profile": "deviceorientation",
        "attribute": "ondeviceorientation",
        "serviceId": scopeArg.deviceOrientationService.id,
        "params": {},
        "onsuccess": function () {
          if (typeof callbackArg.onsuccess == 'function') {
            callbackArg.onsuccess();
          }
        },
        "onerror": function (errorCode, errorMessage) {
          if (typeof callbackArg.onerror == 'function') {
            callbackArg.onerror();
          }
        }
      });
    };

    this.addPairControllerScope(scope, callback);
  };

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

    $scope.pairs = [new Pair(null)];

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

      $scope.lastTime = Date.now();

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
        //console.log("activatePair");

        var callback = {
          onsuccess: function () {
            //$scope.pairStatus = 'started';
            //$scope.$apply();
            $scope.$applyAsync(function() {
              $scope.pairStatus = 'started';
            });
          },
          onerror: function () {
            //$scope.pairStatus = oldStatus;
            //$scope.$apply();
            $scope.$applyAsync(function() {
              $scope.pairStatus = oldStatus;
            });
          }
        };

        for (var i = 0; i < deviceOrientationServices.length; ++i) {
          var service = deviceOrientationServices[i];
          if (service.id == $scope.deviceOrientationService.id && service.pairControllerScopes.indexOf($scope) == -1) {
            var oldStatus = $scope.pairStatus;
            $scope.pairStatus = 'registering';
            service.addPairControllerScope($scope, callback);
            return;
          }
        }

        deviceOrientationServices.push(new DeviceOrientationService($scope, callback));
        $scope.pairStatus = 'started';
      };

      /**
       * ペアの加速度とライト連携を停止する。
       */
      $scope.deactivatePair = function () {
        //console.log("deactivatePair");

        for (var i = 0; i < deviceOrientationServices.length; ++i) {
          var service = deviceOrientationServices[i];
          if (typeof $scope.deviceOrientationService != 'undefined' && service.id == $scope.deviceOrientationService.id
              && service.pairControllerScopes.indexOf($scope) != -1) {
            var oldStatus = $scope.pairStatus;
            $scope.pairStatus = 'unregistering';
            service.removePairControllerScope($scope, {
              onsuccess: function () {
                //console.log('removePairControllerScope success');
                $scope.$applyAsync(function () {
                  $scope.pairStatus = 'stopped';
                });
              },
              onerror: function () {
                //console.log('removePairControllerScope error');
                $scope.$applyAsync(function () {
                  $scope.pairStatus = oldStatus;
                });
              }
            });
          }
        }
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
