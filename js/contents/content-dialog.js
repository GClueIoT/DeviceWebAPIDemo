(function() {
  angular.module('demoweb').controller('ModalInstanceCtrl', function ($scope, $modalInstance, title, message, onclose) {
    $scope.title = title;
    $scope.message = message;
    $scope.ok = function () {
      $modalInstance.close();
      if (onclose) {
        onclose();
      }
    };
  });
})();
