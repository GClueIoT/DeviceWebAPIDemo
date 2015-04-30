(function() {
  angular.module('demoweb')
    .service('deviceService', ['$rootScope', function($rootScope) {
      var service = {
        devices: [],
        addDevice: function (device) {
          service.devices.push(device);
        },
        removeAll: function() {
          service.devices = [];
        }
      }
      return service;
    }]);
})();