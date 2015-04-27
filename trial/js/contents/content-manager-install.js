(function() {
  var apk = {
    file: 'dConnectManager.apk',
    name: 'Device WebAPI Manager'
  };

  angular.module('demoweb')
    .controller('trialManagerInstallCtrl', ['$scope', '$routeParams', '$window', function($scope, $routeParams, $window) {
      $scope.title = 'インストール / URLスキーム';
      $scope.apk_name = apk.file;
      $scope.install = function() {
        $window.location.href = './trial/apk/' + apk.file;
      };
      $scope.back = function() {
        $window.history.back();
      };
      $scope.urlScheme = function() {
        dConnect.startManager();
      };
    }]);
})();