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
      'health',
      'humandetect',
      'remote_controller',
      'kadecot',
      'deviceorientation'
    ],

    manager: {
      android: {
        minVersion: '1.0.6',
        packageName: 'org.deviceconnect.android.manager',
        name: 'Device Web API Manager'
      },
      ios: {
        minVersion: '1.0.3',
        appId: '994422987'
      }
    },

    plugins: [
      {
        packageName: "org.deviceconnect.android.deviceplugin.host",
        name: "host",
        supports: ['deviceorientation']
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
        packageName: "org.deviceconnect.android.deviceplugin.irkit",
        name: "IRKit",
        supports: ['remote_controller']
      },
      {
        packageName: "org.deviceconnect.android.deviceplugin.pebble",
        name: "Pebble",
        supports: ['deviceorientation']
      },
      {
        packageName: "org.deviceconnect.android.deviceplugin.sw",
        name: "Sony Smart Watch",
        supports: ['deviceorientation']
      },
      {
        packageName: "org.deviceconnect.android.deviceplugin.alljoyn",
        name: "AllJoyn",
        supports: ['light']
      },
      {
        packageName: "com.sonycsl.Kadecot",
        name: "Kadecot",
        supports: ['kadecot']
      },
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
      remote: {
        profiles: ['remote_controller'],
        path: '/remote'
      },
      accelerationLight: {
        // This demo requires services with a 'light' *OR* 'deviceorientation'
        // profile; No profiles are specified here for AND filtering, but OR
        // filtering is performed in the demo contents.
        profiles: [],
        path: '/acceleration-light'
      }
    }
  };

  angular.module('demoweb').constant('demoConstants', constants);
})();