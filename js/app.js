angular.module('demoweb', ['ngRoute', 'ui.bootstrap'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
    .when('/', {
      templateUrl: 'app/content-list.html',
      controller: 'demoListCtrl'
    })
    .when('/error/:errorCode', {
      templateUrl: 'app/content-error.html',
      controller: 'errorCtrl'
    })
    .when('/launch', {
      templateUrl: 'app/content-launch.html',
      controller: 'launchCtrl'
    })
    .when('/settings', {
      templateUrl: 'app/content-settings-all.html',
      controller: 'settingsCtrl'
    })
    .when('/settings/:demoName', {
      templateUrl: 'app/content-settings.html',
      controller: 'settingsCtrl'
    })
    .when('/light', {
      templateUrl: 'app/content-light.html'
    })
    .when('/light/select', {
      templateUrl: 'app/content-light-select.html'
    })
    .otherwise({redirectTo: '/'});
  }]);
