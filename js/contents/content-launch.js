(function() {
  angular.module('demoweb')
    .controller('launchCtrl', ['$scope', '$location', 'demoWebClient', 'demoConstants', function($scope, $location, demoWebClient, demoConstants) {
      $scope.title = 'システム起動確認';
      $scope.startManager = function() {
        if (demoConstants.DEBUG) {
          $location.path('/trial/install/' + demoConstants.manager.packageName);
        } else {
          demoWebClient.startManager();
        }
      };
    }]);
})();