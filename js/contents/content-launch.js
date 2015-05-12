(function() {

  var progressModal;

  var client;

  var appLocation;

  var pluginTimerId;

  function showProgress() {
    var modalInstance = progressModal.open({
      templateUrl: 'progress.html',
      controller: 'ProgressInstanceCtrl',
      size: 'lg',
      resolve: {
        'title': function() {
          return '待機中';
        },
        'message': function() {
          return 'Device Web API Managerの起動完了を待っています...';
        }
      }
    });
    modalInstance.result.then(function () {
    }, function() {
      if (pluginTimerId) {
        clearTimeout(pluginTimerId);
      }
    });
    return modalInstance;
  }

  function showConfirm() {
    var modalInstance = progressModal.open({
      templateUrl: 'confirm-dialog.html',
      controller: 'ModalInstanceCtrl',
      size: 'lg',
      resolve: {
        'title': function() {
          return '確認';
        },
        'message': function() {
          return 'Device Web APIの起動完了を確認しました。デモ一覧画面に戻ります。';
        }
      }
    });
    modalInstance.result.then(function () {
      appLocation.path('/');
    });
  }

  function waitAvailability(callback) {
    pluginTimerId = setTimeout(function() {
      client.checkAvailability({
        onsuccess: function(version) {
          callback.onavailable();
        },
        onerror: function(errorCode, errorMessage) {
          waitAvailability(callback);
        }
      });
    }, 250);
  }

  function isMobile() {
    return isAndroid() || isIOS();
  }

  function isAndroid() {
    var ua = navigator.userAgent;
    if (/Android/.test(ua)) {
      return true;
    }
    return false;
  }

  function isIOS() {
    var ua = navigator.userAgent;
    if(/iPhone/.test(ua)) {
      return true;
    } else if(/iPad/.test(ua)) {
      return true;
    }
    return false;
  }

  angular.module('demoweb')
    .controller('launchCtrl', ['$scope', '$location', '$window', '$modal', 'demoWebClient', 'demoConstants', function($scope, $location, $window, $modal, demoWebClient, demoConstants) {
      progressModal = $modal;
      client = demoWebClient;
      appLocation = $location;

      $scope.title = 'システム起動確認';

      $scope.startManager = function() {
        if (!isMobile()) {
          showWarning();
          return;
        }

        var modalInstance = showProgress();
        waitAvailability({
          onavailable: function() {
            modalInstance.close();
            showConfirm();
          }
        })

        if (demoConstants.DEBUG && isAndroid()) {
          $window.location.href = './trial/apk/dConnectManager.apk';
        } else {
          demoWebClient.startManager();
        }
      };
      $scope.back = function() {
        $window.history.back();
      };

      function showWarning() {
        console.log('showWarning: manager');
        var modalInstance = progressModal.open({
          templateUrl: 'dialog.html',
          controller: 'ModalInstanceCtrl',
          size: 'lg',
          resolve: {
            'title': function() {
              return '注意';
            },
            'message': function() {
              return 'PC上で操作する場合は、Device Web API ManagerをAndroid端末上にインストールかつ起動した後、本ページをリロードしてください。';
            }
          }
        });
        modalInstance.result.then(function (result) {
          if (result) {
            var url = 'https://play.google.com/store/apps/details?id=' + demoConstants.manager.packageName;
            console.log('Google Play: ' + url);
            $window.location.href = url;
          }
        });
        return modalInstance;
      }
    }]);
})();