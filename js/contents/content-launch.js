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
          return 'Device WebAPI Managerの起動完了を待っています...';
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
          return 'Device WebAPIの起動完了を確認しました。デモ一覧画面に戻ります。';
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

  angular.module('demoweb')
    .controller('launchCtrl', ['$scope', '$location', '$window', '$modal', 'demoWebClient', 'demoConstants', function($scope, $location, $window, $modal, demoWebClient, demoConstants) {
      progressModal = $modal;
      client = demoWebClient;
      appLocation = $location;

      $scope.title = 'システム起動確認';

      var modalInstance;
      $scope.startManager = function() {
        modalInstance = showProgress();
        waitAvailability({
          onavailable: function() {
            modalInstance.close();
            showConfirm();
          }
        })

        if (demoConstants.DEBUG) {
          $window.location.href = './trial/apk/dConnectManager.apk';
        } else {
          demoWebClient.startManager();
        }
      };
    }]);
})();