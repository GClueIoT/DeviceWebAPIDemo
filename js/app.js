var _client = new demoWeb.Client();
_client.setApplicationName('DemoWeb');
_client.setScopes([
  'servicediscovery',
  'serviceinformation',
  'system',
  'light'
]);
_client.setReleasedPlugins([
  {
    packageName: "org.deviceconnect.android.deviceplugin.hue",
    name: "hue"
  },
  {
    packageName: "org.deviceconnect.android.deviceplugin.sphero",
    name: "Sphero"
  },
]);

angular.module('demoweb', ['ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
    .when('/', {templateUrl: 'content-list.html'})
    .when('/launch', {templateUrl: 'content-launch.html'})
    .when('/settings', {templateUrl: 'content-settings.html'})
    .when('/light', {templateUrl: 'content-light.html'})
    .otherwise({redirectTo: '/'});
  }])
  .controller('demoCtrl', ['$scope', '$location', function($scope, $location) {
    _client.checkAvailability({
      onsuccess: function(version) {
        $location.path('/');
      },
      onerror: function(errorCode, errorMessage) {
        alert('error: ' + errorMessage);
        $location.path('/launch');
      }
    });
  }])
  .controller('demoListCtrl', ['$scope', '$location', function($scope, $location) {
    $scope.transit = function(nextPath) {
      _client.discoverDevices({
        onsuccess: function(json) {
          var devices;
          console.log('found devices: ', json.services);

          devices = json.services.filter(function(service) {
            var relatedScopes = service.scopes.filter(function(scope) {
              return scope === 'light';
            });
            return relatedScopes.length > 0;
          });
          console.log('filtered devices: ', devices);

          if (devices.length === 0) {
            _client.discoverPlugins({
              onsuccess: function(plugins) {
                $scope.$apply(function() {
                  $location.path('/settings');
                });
              },

              onerror: function(errorCode, errorMessage) {
                console.log('transit - discoverPlugins: errorCode=' + errorCode + ' errorMessage=' + errorMessage);
              }
            });
          } else {
            console.log('nextPath: ' + nextPath);
            $scope.$apply(function() {
              $location.path(nextPath);
            });
          }
        },

        onerror: function(errorCode, errorMessage) {
          $location.path('/settings');
        }
      });
    };
  }])
  .controller('launchCtrl', ['$scope', function($scope) {
    $scope.startManager = function() {
      _client.startManager();
    };
  }])
  .controller('settingsCtrl', ['$scope', function($scope) {
    var plugins = _client.getPlugins(),
        i, p;

    console.log('plugins: ', plugins);
    for (i = 0; i < plugins.length; i++) {
      p = plugins[i];
      p.operation = (p.installed === true) ? '設定' : 'インストール';
      p.action = (p.installed === true) ? "wakeup('" + p.id + "')" : "goToStore('" + p.packageName + "')";
    }
    $scope.plugins = plugins;
    $scope.wakeup = function(index) {
      console.log("wakeup: " + index);
      var p = plugins[index];
      if (p.installed === true) {
        _client.openSettingWindow({
          pluginId: p.id,
          onsuccess: function(json) {
            console.log('openSettingWindow: success: ', json);
          },
          onerror: function(errorCode, errorMessage) {
            console.log('openSettingWindow: error: ' + errorCode + ' message=' + errorMessage);
          }
        });
      } else {
        location.href = "market://details?id=" + p.packageName;
      }
    };
    $scope.nextPath = '/light';

    $scope.print = function(text) {
      console.log('print: ' + text);
    };
  }]);