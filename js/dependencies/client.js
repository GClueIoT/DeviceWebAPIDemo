(function() {

  function isAndroid() {
    return (navigator.userAgent.indexOf('Android') > 0);
  }

  angular.module('demoweb')
    .factory('demoWebClient', ['demoConstants', function (demoConstants) {
      var client = new demoWeb.Client();
      client.setApplicationName(demoConstants.applicationName);
      client.setScopes(demoConstants.scopes);
      if (isAndroid()) {
        client.setReleasedPlugins(demoConstants.plugins);
      }
      return client;
    }]);
})();