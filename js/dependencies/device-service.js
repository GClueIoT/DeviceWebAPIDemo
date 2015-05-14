(function() {

  var buffer = {};

  angular.module('demoweb')
    .service('deviceService', ['$rootScope', function($rootScope) {
      var service = {

        list: function(id) {
          var list = buffer[id];
          if (list === undefined) {
            list = {
              devices: [],
              addDevice: function (device) {
                list.devices.push(device);
              },
              removeAll: function() {
                list.devices = [];
              }
            };
            buffer[id] = list;
          }
          return list;
        }

      }
      return service;
    }]);
})();