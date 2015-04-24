(function() {
  angular.module('demoweb')
    .controller('demoListCtrl', ['$scope', '$location', 'demoWebClient', 'demoConstants', function($scope, $location, demoWebClient, demoConstants) {
      $scope.title = 'デモ一覧';
      $scope.transit = function(demoName) {
        demoWebClient.discoverDevices({
          onsuccess: function(services) {
            var devices = services.filter(function(service) {
              if (!service.scopes) {
                return false;
              }
              var profiles = demoConstants.demos[demoName].profiles,
                  scopes = service.scopes,
                  i, j, found;
              for (i = 0; i < profiles.length; i++) {
                found = false;
                loop:
                for (j = 0; j < scopes.length; j++) {
                  if (profiles[i] === scopes[j]) {
                    found = true;
                    break loop;
                  }
                }
                if (!found) {
                  return false;
                }
              }
              return true;
            });
            console.log('filtered devices: ', devices);

            if (devices.length === 0) {
              demoWebClient.discoverPlugins({
                onsuccess: function(plugins) {
                  $scope.$apply(function() {
                    $location.path('/settings/' + demoName);
                  });
                },

                onerror: function(errorCode, errorMessage) {
                  console.log('transit - discoverPlugins: errorCode=' + errorCode + ' errorMessage=' + errorMessage);
                }
              });
            } else {
              $scope.$apply(function() {
                $location.path(demoConstants.demos[demoName].path);
              });
            }
          },

          onerror: function(errorCode, errorMessage) {
            $location.path('/settings/' + demoName);
          }
        });
      };
    }]);
})();