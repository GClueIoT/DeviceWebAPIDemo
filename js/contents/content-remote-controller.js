(function () {
  'use strict';

  var RemoteController = function ($scope, $modal, $window, $location, demoWebClient) {
    $scope.title = 'リモートコントローラー';
    $scope.settingAll = function() {
      demoWebClient.discoverPlugins({
        onsuccess: function(plugins) {
          $scope.$apply(function() {
            $location.path('/settings/remote');
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
    };
  };

  angular.module('demoweb')
    .controller('RemoteController', 
      ['$scope', '$modal', '$window', '$location', 'demoWebClient', RemoteController]);
})();
