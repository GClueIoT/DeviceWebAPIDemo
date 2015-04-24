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
    name: "hue",
    supports: ['light']
  },
  {
    packageName: "org.deviceconnect.android.deviceplugin.sphero",
    name: "Sphero",
    supports: ['light']
  }
]);

var _demos = {
  light: {
    profiles: ['light'],
    path: '/light'
  }
};

var app = angular.module('demoweb', ['ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
    .when('/', {
      templateUrl: 'app/content-list.html',
      controller: 'demoListCtrl'
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
    .when('/light', {templateUrl: 'app/content-light.html'})
    .when('/light/select', {templateUrl: 'app/content-light-select.html'})
    .otherwise({redirectTo: '/'});
  }])
  .controller('demoCtrl', ['$scope', '$location', function($scope, $location) {
    _client.checkAvailability({
      onsuccess: function(version) {
        $location.path('/');
      },
      onerror: function(errorCode, errorMessage) {
        $location.path('/launch');
      }
    });

    $scope.settingAll = function() {
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
    };
  }])
  .controller('demoListCtrl', ['$scope', '$location', function($scope, $location) {
    $scope.title = 'デモ一覧';
    $scope.transit = function(demoName) {
      _client.discoverDevices({
        onsuccess: function(services) {
          var devices = services.filter(function(service) {
            if (!service.scopes) {
              return false;
            }
            var profiles = _demos[demoName].profiles,
                scopes = service.scopes,
                i, j, found;
            for (i = 0; i < profiles.length; i++) {
              found = false;
              loop:
              for (j = 0; j < scopes.length; j++) {
                if (profiles[i] === scopes[j]) {
                  found = true;
                  break loop;
                }
              }
              if (!found) {
                return false;
              }
            }
            return true;
          });
          console.log('filtered devices: ', devices);

          if (devices.length === 0) {
            _client.discoverPlugins({
              onsuccess: function(plugins) {
                $scope.$apply(function() {
                  $location.path('/settings/' + demoName);
                });
              },

              onerror: function(errorCode, errorMessage) {
                console.log('transit - discoverPlugins: errorCode=' + errorCode + ' errorMessage=' + errorMessage);
              }
            });
          } else {
            $scope.$apply(function() {
              $location.path(_demos[demoName].path);
            });
          }
        },

        onerror: function(errorCode, errorMessage) {
          $location.path('/settings/' + demoName);
        }
      });
    };
  }])
  .controller('launchCtrl', ['$scope', function($scope) {
    $scope.title = 'システム起動確認';
    $scope.startManager = function() {
      _client.startManager();
    };
  }])
  .controller('settingsCtrl', ['$scope', '$routeParams', '$location', function($scope, $routeParams, $location) {
    $scope.title = 'デバイス設定一覧';
    var plugins = _client.getPlugins(),
        demoName = $routeParams.demoName,
        i, p;

    console.log('settings demoName: ' + demoName);
    if (demoName) {
      plugins = plugins.filter(function(p) {
        var profiles = _demos[demoName].profiles,
            scopes = p.supports,
            i, j, found;
        if (!scopes) {
          return false;
        }
        for (i = 0; i < profiles.length; i++) {
          found = false;
          loop:
          for (j = 0; j < scopes.length; j++) {
            if (profiles[i] === scopes[j]) {
              found = true;
              break loop;
            }
          }
          if (!found) {
            return false;
          }
        }
        return true;
      })
    }

    for (i = 0; i < plugins.length; i++) {
      p = plugins[i];
      p.operation = (p.installed === true) ? '設定' : 'インストール';
    }

    $scope.plugins = plugins;
    $scope.wakeup = function(index) {
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
        location.href = 'market://details?id=' + p.packageName;
      }
    };

    $scope.next = function() {
      var path = _demos[demoName].path;
      console.log('path: ' + path);
      $location.path(path);
    };
  }]);

app.service('lightData', ['$rootScope', function($rootScope) {
  var service = {
    lights: [],
    addLight: function (light) {
      service.lights.push(light);
    },
    removeAll: function() {
      service.lights = [];
    },
    setLight: function(list) {
      service.lights = [];
      service.lights.concat(list);
    }
  }
  return service;
}]);