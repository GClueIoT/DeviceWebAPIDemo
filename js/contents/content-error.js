(function() {
  function message(errorCode) {
    // TODO 他のエラーコードのメッセージを追加する
    switch(errorCode) {
    case -1:
      return 'Device WebAPIサーバが見つかりません。';
    case 18: // INVALID_ORIGIN
      return '本アプリからはDevice WebAPIにアクセスできません。ホワイトリストの設定をご確認ください。'
    default:
      return '不明なエラーが発生しました。';
    }
  }

  angular.module('demoweb')
    .controller('errorCtrl', ['$scope', '$routeParams', 'demoConstants', function($scope, $routeParams, demoConstants) {
      $scope.title = 'エラー発生';
      $scope.message = message(Number($routeParams.errorCode));
    }]);
})();