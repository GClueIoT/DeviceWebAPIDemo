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
      'remote_controller',
      'mediastream_recording'
    ],

    manager: {
      packageName: 'org.deviceconnect.android.manager',
      name: 'Device Web API Manager'
    },

    plugins: [
      {
        packageName: "org.deviceconnect.android.deviceplugin.host",
        name: "host",
        supports: ['light', 'mediastream_recording']
      },
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
      },
      {
        packageName: "org.deviceconnect.android.deviceplugin.irkit",
        name: "IRKit",
        supports: ['remote_controller']
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
      },
      remote: {
        profiles: ['remote_controller'],
        path: '/remote'
      }
    }
  };

  angular.module('demoweb').constant('demoConstants', constants);
})();