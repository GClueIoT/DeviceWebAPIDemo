(function() {
  var apkList = {};
  apkList['org.deviceconnect.android.deviceplugin.hue'] = {
    file: 'dConnectDeviceHue.apk',
    name: 'hue'
  };
  apkList['org.deviceconnect.android.deviceplugin.sphero'] = {
    file: 'dConnectDeviceSphero.apk',
    name: 'Sphero'
  };
  apkList['org.deviceconnect.android.deviceplugin.heartrate'] = {
    file: 'dConnectDeviceHeartRate.apk',
    name: 'HeartRate'
  };
  apkList['org.deviceconnect.android.deviceplugin.hvc'] = {
    file: 'dConnectDeviceHVC.apk',
    name: 'HVC'
  };

  angular.module('demoweb')
    .controller('trialPluginInstallCtrl', ['$scope', '$routeParams', '$window', function($scope, $routeParams, $window) {
      var packageName = $routeParams.package;
      if (!packageName) {
        return;
      }

      var apk = apkList[packageName];
      if (!apk) {
        return;
      }

      $scope.title = 'インストール';
      $scope.apk_name = apk.file;
      $scope.install = function() {
        $window.location.href = './trial/apk/' + apk.file;
      };
      $scope.back = function() {
        $window.history.back();
      };
    }]);
})();