(function() {
  angular.module('demoweb')
    .controller('launchCtrl', ['$scope', 'demoWebClient', function($scope, demoWebClient) {
      $scope.title = 'システム起動確認';
      $scope.startManager = function() {
        demoWebClient.startManager();
      };
    }]);
})();