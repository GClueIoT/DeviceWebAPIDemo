(function() {
  'use strinct';

  var constants = {
    DEBUG: false,

    applicationName: 'Demo Web',

    scopes: [
      'servicediscovery',
      'serviceinformation',
      'system',
      'light',
      'health'
    ],

    manager: {
      packageName: 'org.deviceconnect.android.manager',
      name: 'Device WebAPI Manager'
    },

    plugins: [
      {
        packageName: "org.deviceconnect.android.deviceplugin.hue",
        name: "hue",
        supports: ['light']
      },
      {
        packageName: "org.deviceconnect.android.deviceplugin.sphero",
        name: "Sphero",
        supports: ['light']
      },
      {
        packageName: "org.deviceconnect.android.deviceplugin.heartrate",
        name: "HeartRate",
        supports: ['health']
      }
    ],

    demos: {
      light: {
        profiles: ['light'],
        path: '/light'
      },
      heartrate: {
        profiles: ['health'],
        path: '/heartrate'
      }
    }
  };

  angular.module('demoweb').constant('demoConstants', constants);
})();