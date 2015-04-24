(function() {
  angular.module('demoweb')
    .service('lightService', ['$rootScope', function($rootScope) {
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
})();