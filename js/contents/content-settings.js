(function() {
  angular.module('demoweb')
    .controller('settingsCtrl', ['$scope', '$routeParams', '$location', 'demoWebClient', 'demoConstants', 'transition', function($scope, $routeParams, $location, demoWebClient, demoConstants, transition) {
      transition.scope = $scope;
      
      $scope.title = 'デバイス設定一覧';
      var plugins = demoWebClient.getPlugins(),
          demoName = $routeParams.demoName,
          i, p;

      console.log('settings demoName: ' + demoName);
      if (demoName) {
        plugins = demoWebClient.getPlugins({profiles: demoConstants.demos[demoName].profiles});
      }

      for (i = 0; i < plugins.length; i++) {
        p = plugins[i];
        p.operation = (p.installed === true) ? '設定' : 'インストール';
      }

      $scope.plugins = plugins;
      $scope.wakeup = function(index) {
        var p = plugins[index];
        if (p.installed === true) {
          demoWebClient.openSettingWindow({
            pluginId: p.id,
            onsuccess: function(json) {
              console.log('openSettingWindow: success: ', json);
            },
            onerror: function(errorCode, errorMessage) {
              transition.next('/error/' + errorCode);
            }
          });
        } else {
          if (demoConstants.DEBUG) {
            $location.path('/trial/plugin/install/' + p.packageName);
          } else {
            location.href = 'market://details?id=' + p.packageName;
          }
        }
      };

      $scope.next = function() {
        $location.path(demoConstants.demos[demoName].path);
      };
    }]);
})();