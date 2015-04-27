(function() {
  var plugins = {};
  plugins['org.deviceconnect.android.deviceplugin.hue'] = {
    file: 'dConnectDeviceHue.apk',
    name: 'hue'
  };
  plugins['org.deviceconnect.android.deviceplugin.sphero'] = {
    file: 'dConnectDeviceSphero.apk',
    name: 'Sphero'
  };

  angular.module('demoweb')
    .controller('trialInstallCtrl', ['$scope', '$routeParams', '$window', function($scope, $routeParams, $window) {
      var packageName = $routeParams.package;
      if (!packageName) {
        return;
      }

      var plugin = plugins[packageName];
      if (!plugin) {
        return;
      }

      $scope.title = plugin.name;
      $scope.apk_name = plugin.file;
      $scope.install = function() {
        $window.location.href = './trial/apk/' + plugin.file;
      };
      $scope.back = function() {
        $window.history.back();
      };
    }]);
})();