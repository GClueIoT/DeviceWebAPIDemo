(function() {
  angular.module('demoweb')
    .factory('demoWebClient', ['demoConstants', function (demoConstants) {
      var client = new demoWeb.Client();
      client.setApplicationName(demoConstants.applicationName);
      client.setScopes(demoConstants.scopes);
      client.setReleasedPlugins(demoConstants.plugins);
      return client;
    }]);
})();