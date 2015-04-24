(function() {
  angular.module('demoweb')
    .controller('demoCtrl', ['$scope', '$location', 'demoWebClient', function($scope, $location, demoWebClient) {
      demoWebClient.checkAvailability({
        onsuccess: function(version) {
          $location.path('/');
        },
        onerror: function(errorCode, errorMessage) {
          $location.path('/launch');
        }
      });

      $scope.settingAll = function() {
        demoWebClient.discoverPlugins({
          onsuccess: function(plugins) {
            $scope.$apply(function() {
              $location.path('/settings');
            });
          },

          onerror: function(errorCode, errorMessage) {
            console.log('transit - discoverPlugins: errorCode=' + errorCode + ' errorMessage=' + errorMessage);
          }
        });
      };
    }]);
})();