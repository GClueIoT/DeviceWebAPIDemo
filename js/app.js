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
    .when('/light', {
      templateUrl: 'app/content-light.html'
    })
    .when('/light/select', {
      templateUrl: 'app/content-light-select.html'
    })
    .when('/trial/manager/install', {
      templateUrl: 'trial/app/content-manager-install.html',
      controller: 'trialManagerInstallCtrl'
    })
    .when('/trial/plugin/install/:package', {
      templateUrl: 'trial/app/content-plugin-install.html',
      controller: 'trialPluginInstallCtrl'
    })
    .otherwise({redirectTo: '/'});
  }]);
