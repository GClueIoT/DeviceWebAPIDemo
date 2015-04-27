(function() {

  function getIpString() {
    if (1 < document.location.search.length) {
      var query = document.location.search.substring(1);
      var parameters = query.split('&');
      for (var i = 0; i < parameters.length; i++) {
        var element = parameters[i].split('=');
        var paramName = decodeURIComponent(element[0]);
        var paramValue = decodeURIComponent(element[1]);
        if (paramName == 'ip') {
          return paramValue;
        }
      }
    }
    return 'localhost';
  }

  angular.module('demoweb')
    .controller('demoCtrl', ['$scope', '$location', 'demoWebClient', 'transition', function($scope, $location, demoWebClient, transition) {
      transition.scope = $scope;

      demoWebClient.setHost(getIpString());
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