(function() {
  var lightDemo = {
    name: 'light',
    img: 'img/Appli_light.png',
    title: 'ライト'
  }
  var heartRateDemo =  {
    name: 'heartrate',
    img: 'img/Appli_Heart.png',
    title: '心拍計'
  };
  var hvccDemo =  {
    name: 'hvcc',
    img: 'img/Appli_Facial expression recognition.png',
    title: '顔認識'
  };

  function isIOS() {
    var ua = navigator.userAgent;
    if(/iPhone/.test(ua)) {
      return true;
    } else if(/iPad/.test(ua)) {
      return true;
    }
    return false;
  }

  angular.module('demoweb')
    .controller('demoListCtrl', ['$scope', '$window', '$location', '$compile', 'demoWebClient', 'demoConstants', 'transition', function($scope, $window, $location, $compile, demoWebClient, demoConstants, transition) {
      transition.scope = $scope;

      var demos = [];
      demos.push(lightDemo);
      if (!isIOS()) {
        demos.push(heartRateDemo);
//        demos.push(hvccDemo);
      }

      var size = demos.length < 8 ? 4 : Math.ceil(demos.length / 2);
      var index = 0;
      for (var i = 0; i < size; i++) {
        var t = '<tr>';
        for (var j = 0; j < 2; j++) {
          if (index < demos.length) {
            t += '<td class="demo" ng-click="transit(\'' + demos[index].name + '\')">';
            t += '<img class="logo" src="' + demos[index].img + '">';
            t += '<span class="demo-name">' + demos[index].title + '</span>';
            t += '</td>';
          } else {
            t += '<td class="nodemo"></td>';
          }
          index++;
        }
        t += '</tr>';
        $('.demo-list').append($compile(t)($scope));
      }

      $scope.title = 'デモ一覧';
      $scope.back = function() {
        $window.history.back();
      };
      $scope.transit = function(demoName) {
        demoWebClient.discoverDevices({
          onsuccess: function(services) {
            var devices = services.filter(function(service) {
              if (!service.scopes) {
                return false;
              }
              var profiles = demoConstants.demos[demoName].profiles,
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
              demoWebClient.discoverPlugins({
                onsuccess: function(plugins) {
                  transition.next('/prompt/settings/' + demoName);
                },

                onerror: function(errorCode, errorMessage) {
                  console.log('transit - discoverPlugins: errorCode=' + errorCode + ' errorMessage=' + errorMessage);
                  transition.next('/error/' + errorCode);
                }
              });
            } else {
              transition.next(demoConstants.demos[demoName].path);
            }
          },

          onerror: function(errorCode, errorMessage) {
            transition.next('/error/' + errorCode);
          }
        });
      };
    }]);
})();