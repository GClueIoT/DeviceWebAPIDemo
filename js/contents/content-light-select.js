(function () {
  'use strict';

  var SelectLightController = function($scope) {
    $scope.list = {
        'name'  : 'Light一覧',
        'lights' : [
          { 'name' : 'light name1'},
          { 'name' : 'light name1'},
          { 'name' : 'light name1'},
          { 'name' : 'light name1'},
          { 'name' : 'light name1'},
          { 'name' : 'light name1'},
          { 'name' : 'light name1'},
          { 'name' : 'light name1'},
          { 'name' : 'light name1'},
          { 'name' : 'light name1'},
          { 'name' : 'light name2'}
        ]
      }
    $scope.registerAll = function() {
    }
    $scope.unregisterAll = function() {
    }
    $scope.cancel = function() {
    }
    $scope.ok = function() {
    }
  };

  angular.module('demoweb')
    .controller('SelectLightController', ['$scope', '$location', SelectLightController]);
})();
