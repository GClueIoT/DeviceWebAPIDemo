angular.module('demoweb', ['ngRoute'])
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
    .when('/prompt/settings/:demoName', {
      templateUrl: 'app/content-prompt-settings.html',
      controller: 'promptSettingsCtrl'
    })
    .when('/settings', {
      templateUrl: 'app/content-settings-all.html',
      controller: 'settingsCtrl'
    })
    .when('/settings/:demoName', {
      templateUrl: 'app/content-settings.html',
      controller: 'settingsCtrl'
    })
    .when('/light', {templateUrl: 'app/content-light.html'})
    .when('/light/select', {templateUrl: 'app/content-light-select.html'})
    .when('/trial/install/:package', {
      templateUrl: 'trial/app/content-install.html',
      controller: 'trialInstallCtrl'
    })
    .otherwise({redirectTo: '/'});
  }]);
