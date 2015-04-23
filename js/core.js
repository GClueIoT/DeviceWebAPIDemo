/**
 * Namespace of DemoWeb application's core.
 * 
 * <p>
 * Dependencies:
 * <ul>
 * <li>dconnectsdk 2.0.0</li>
 * <li>jquery 1.11.2</li>
 * <li>jquery-cookie 1.4.1</li>
 * </ul>
 * </p>
 *
 * @namespace
 */
var demoWeb = (function (parent) {
  'use strict';

  $.cookie.json = true;

  /**
   * Key of auth info of Client.
   * @private
   * @const
   * @type {!string}
   */
  var KEY_AUTH_SETTINGS = 'demoWeb.settings';

  /**
   * Loads auth info of Client from Cookie.
   * @private
   * @param {!demoWeb.Client} client
   */
  var _loadSettings = function(client) {
    client.settings = $.cookie(KEY_AUTH_SETTINGS) || {
      clientId: Date.now().toString(),
      accessToken: undefined
    };
  };

  /**
   * Stores auth info of Client to Cookie.
   * @private
   * @param {!demoWeb.Client} client
   */
  var _storeSettings = function(client) {
    $.cookie(KEY_AUTH_SETTINGS, client.settings);
  };

  /**
   * Constructor of Client.
   * Loads its auth info from Cookie when an instance is constructed.
   * @public
   * @class Client
   * @memberof demoWeb
   */
  var Client = function() {
    _loadSettings(this);
    this.lastKnownDevices = [];
    this.releasedPlugins = [];
    this.installedPlugins = [];
  };
  parent.Client = Client;

  /**
   * Set a host of GotAPI Server.
   * @public
   * @memberof demoWeb.Client
   * @param {!string} host a host of Device Connect server
   */
  Client.prototype.setHost = function(host) {
    dConnect.setHost(host);
  };

  /**
   * Sets an application's name.
   * The value is used as a request parameter of Grant API.
   * @public
   * @memberof demoWeb.Client
   * @param {!string} name an application's name
   */
  Client.prototype.setApplicationName = function(name) {
    this.applicationName = name;
  };

  /**
   * Sets an array of scopes.
   * The value is used as a request parameter of Grant API.
   * @public
   * @memberof demoWeb.Client
   * @param {!string[]} scopes an array of scopes
   */
  Client.prototype.setScopes = function(scopes) {
    this.scopes = scopes;
  };

  Client.prototype.setReleasedPlugins = function(plugins) {
    this.releasedPlugins = plugins;
  };

  Client.prototype.setInstalledPlugins = function(plugins) {
    this.installedPlugins = plugins;
  };

  Client.prototype.getPlugins = function() {
    var list = [],
        i,
        self = this;
    
    function isInstalled(packageName) {
      var i;
      for (i = 0; i < self.installedPlugins.length; i++) {
        if (packageName === self.installedPlugins[i].packageName) {
          return true;
        }
      }
      return false;
    }

    for (i = 0; i < self.installedPlugins.length; i++) {
      list.push(self.installedPlugins[i]);
    }
    for (i = 0; i < self.releasedPlugins.length; i++) {
      if (!isInstalled(self.releasedPlugins[i].packageName)) {
        list.push(self.releasedPlugins[i]);
      }
    }
    return list;
  };

  /**
   * Application Authorization Callback.
   * @public
   * @memberof demoWeb.Client
   * @typedef {object} AuthCallback
   * @callback
   * @prop {function} onsuccess 
   * @prop {function} onerror 
   */

  /**
   * Authorizes this application.
   * @public
   * @memberof demoWeb.Client
   * @param {demoWeb.Client.AuthCallback} callback an instance of a callback.
   */
  Client.prototype.authorize = function(callback) {
    var self = this;

    dConnect.authorization(self.scopes, self.applicationName, function(clientId, accessToken) {
      self.settings.clientId = clientId;
      self.settings.accessToken = accessToken;
      _storeSettings(self)
      callback.onsuccess();
    }, function(errorCode, errorMessage) {
      callback.onerror(errorCode, errorMessage);
    });
  };

  Client.prototype.checkAvailability = function(callback) {
    dConnect.checkDeviceConnect(function(version) {
      callback.onsuccess(version);
    }, function(errorCode, errorMessage) {
      callback.onerror(errorCode, errorMessage);
    });
  }

  Client.prototype.startManager = function() {
    dConnect.startManager();
  };

  Client.prototype.openSettingWindow = function(opt) {
    var builder = new dConnect.URIBuilder();
    builder.setProfile('system');
    builder.setInterface('device');
    builder.setAttribute('wakeup');
    builder.addParameter('pluginId', opt.pluginId);

    dConnect.put(builder.build(), null, null, opt.onsuccess, opt.onerror);
  }

  /**
   * Request to devices managed by GotAPI server.
   * @public
   * @memberof demoWeb.Client
   * @typedef {object} Request
   * @prop {!string} method
   * @prop {!string} profile
   * @prop {?string} interface
   * @prop {?string} attribute
   * @prop {?string} accessToken
   * @prop {!object[]} devices 
   * @prop {!object[]} params
   * @prop {function} onsuccess
   * @prop {function} onerror
   * @prop {function} oncomplete
   */

  /**
   * Sends requests to devices managed by GotAPI server.
   * @public
   * @memberof demoWeb.Client
   * @param {demoWeb.Client.Request} req a request
   */
  Client.prototype.request = function(req) {
    req.devices = req.devices || [];
    req.oncomplete = req.oncomplete || function() {};
    req.onsuccess = req.onsuccess || function() {};
    req.onerror = req.onerror || function() {};

    var builder = new dConnect.URIBuilder();
    if (req.profile) {
      builder.setProfile(req.profile);
    }
    if (req.interface) {
      builder.setInterface(req.interface);
    }
    if (req.attribute) {
      builder.setAttribute(req.attribute);
    }
    builder.setAccessToken(this.settings.accessToken);
    for (var key in req.params) {
      builder.addParameter(key, req.params[key]);
    }

    
    var callbacks = [];
    var count = req.devices.length;
    var checkFinished = function() {
      if ((--count) === 0) {
        req.oncomplete();
      }
    };
    for (var i = 0; i < req.devices.length; i++) {
      callbacks.push({
        id: req.devices[i],
        onsuccess: function(json) {
          req.onsuccess(this.id, json);
          checkFinished();
        },
        onerror: function(errorCode, errorMessage) {
          req.onsuccess(this.id, errorCode, errorMessage);
          checkFinished();
        }
      });
    }
    for (var i = 0; i < req.devices.length; i++) {
      builder.setServiceId(req.devices[i]);
      var cb = callbacks[i];
      dConnect.sendRequest(req.method, builder.build(), null, null, cb.onsuccess.bind(cb), cb.onerror.bind(cb));
    }
  };

  /**
   * Callback of plugin discovery.
   * @memberof demoWeb.Client
   * @typedef {object} PluginDiscoveryCallback
   * @prop {demoWeb.Client.OnSuccessPluginDiscovery} onsuccess
   * @prop {demoWeb.Client.OnError} onerror
   */

  /**
   * Callback of device discovery.
   * @memberof demoWeb.Client
   * @typedef {object} DeviceDiscoveryCallback
   * @prop {demoWeb.Client.OnSuccessDeviceDiscovery} onsuccess
   * @prop {demoWeb.Client.OnError} onerror
   */

  /**
   * Function to get a error response.
   * @typedef {function} OnError
   * @memberof demoWeb.Client
   * @param {number} errorCode an error code defined on Device Connect SDK For JavaScript
   * @param {string} errorMessage an error message.
   */

  /**
   * Function to get a success callback of plugin discovery.
   * @typedef {function} OnSuccessPluginDiscovery
   * @memberof demoWeb.Client
   * @param {object} json a response of GET /gotapi/system.
   */

  /**
   * Function to get a success callback of service discovery.
   * @typedef {function} OnSuccessDeviceDiscovery
   * @memberof demoWeb.Client
   * @param {object} json a result of GET /gotapi/servicediscovery
   */

  /**
   * Discovers released plugins.
   * @public
   * @memberof demoWeb.Client
   * @param {demoWeb.Client.PluginDiscoveryCallback} callback
   */
  Client.prototype.discoverPlugins = function(callback) {
    var self = this,
        builder = new dConnect.URIBuilder();
    
    builder.setProfile('system');
    if (self.settings.accessToken) {
      builder.setAccessToken(self.settings.accessToken);
    }
    dConnect.get(builder.build(), null, function(json) {
      var plugins = json.plugins,
          i;
      for (i = 0; i < plugins.length; i++) {
        plugins[i].installed = true;
      }
      self.setInstalledPlugins(plugins);

      callback.onsuccess(self.getPlugins());
    }, function(errorCode, errorMessage) {
      callback.onerror(errorCode, errorMessage);
    });
  };

  /**
   * Returns a list of the last known devices.
   * @public
   * @returns an array of devices which obtained by the last device discovery.
   * @see {@link demoWeb.Client#discoverDevices}
   */
  Client.prototype.getLastKnownDevices = function() {
    return this.lastKnownDevices;
  };

  /**
   * Discovers devices to which GotAPI server can access currently.
   * @public
   * @memberof demoWeb.Client
   * @param {DeviceDiscoveryCallback} callback
   */
  Client.prototype.discoverDevices = function(callback) {
    var self = this;

    dConnect.discoverDevices(self.settings.accessToken, function(json) {
      self.lastKnownDevices = json.services;
      callback.onsuccess(json);
    }, function(errorCode, errorMessage) {
      switch (errorCode) {
      case dConnect.constants.ErrorCode.EMPTY_ACCESS_TOKEN:
      case dConnect.constants.ErrorCode.SCOPE:
        self.authorize({
          onsuccess: function() {
            self.discoverDevices(callback);
          },
          onerror: callback.onerror
        });
        break;
      default:
        callback.onerror(errorCode, errorMessage);
        break;
      }
    });
  };

  /**
   * Opens and connects to a WebSocket.
   * @public
   * @memberof demoWeb.Client
   * @param {function} callback
   */
  Client.prototype.connectWebSocket = function(callback) {
    dConnect.connectWebSocket(this.settings.clientId, callback);
  };

  /**
   * Checks whether a WebSocket is connected or not.
   * @public
   * @memberof demoWeb.Client
   * @returns true if a WebSocket is connected already, otherwise false
   */
  Client.prototype.isConnectedWebSocket = function() {
    return dConnect.isConnectedWebSocket();
  }

  /**
   * Closes and disconnects a WebSocket.
   * @public
   * @memberof demoWeb.Client
   */
  Client.prototype.disconnectWebSocket = function() {
    dConnect.disconnectWebSocket();
  }

  return parent;
})({});
