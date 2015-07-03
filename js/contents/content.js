(function() {

  angular.module('demoweb')
    .controller('demoCtrl', ['$scope', '$location', 'demoWebClient', 'transition', function($scope, $location, demoWebClient, transition) {
      transition.scope = $scope;

      demoWebClient.checkAvailability({
        onsuccess: function(version) {
          transition.next('/');
        },
        onerror: function(errorCode, errorMessage) {
          var path;
          switch(errorCode) {
          case -1:
            path = '/launch';
            break;
          default:
            path = '/error/' + errorCode;
            break;
          }
          transition.next(path);
        }
      });

      $scope.settingAll = function() {
        demoWebClient.discoverPlugins({
          onsuccess: function(plugins) {
            transition.next('/settings');
          },

          onerror: function(errorCode, errorMessage) {
            transition.next('/error/' + errorCode);
          }
        });
      };
    }]);
})();