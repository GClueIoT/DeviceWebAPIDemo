(function() {
  'use strinct';

  var constants = {
    DEBUG: true,

    applicationName: 'Demo Web',

    scopes: [
      'servicediscovery',
      'serviceinformation',
      'system',
      'light',
      'health',
      'humandetect',
      'mediastream_recording'
    ],

    manager: {
      packageName: 'org.deviceconnect.android.manager',
      name: 'Device Web API Manager'
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
      },
      {
        packageName: "org.deviceconnect.android.deviceplugin.hvc",
        name: "HVC",
        supports: ['humandetect']
      },
      {
        packageName: "org.deviceconnect.android.deviceplugin.sonycamera",
        name: "SonyCamera",
        supports: ['mediastream_recording']
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
      },
      face: {
        profiles: ['humandetect'],
        path: '/face'
      },
      camera: {
        profiles: ['mediastream_recording'],
        path: '/camera'
      }
    }
  };

  angular.module('demoweb').constant('demoConstants', constants);
})();