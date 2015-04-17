var demoWeb = (function () {

  $.cookie.json = true;

  var KEY_AUTH_SETTINGS = 'demoWeb.settings';

  var _loadSettings = function(client) {
    client.settings = $.cookie(KEY_AUTH_SETTINGS) || {
      clientId: Date.now().toString(),
      accessToken: undefined
    };
  };

  var _storeSettings = function(client) {
    $.cookie(KEY_AUTH_SETTINGS, client.settings);
  };

  var Client = function() {
    _loadSettings(this);
    this.lastKnownDevices = [];
  };
  parent.Client = Client;

  Client.prototype.setHost = function(ip) {
    dConnect.setHost(ip);
  };

  Client.prototype.setApplicationName = function(name) {
    this.applicationName = name;
  };

  Client.prototype.setScopes = _setScopes = function(scopes) {
    this.scopes = scopes;
  };

  Client.prototype.setReleasedPlugins = function(plugins) {
    this.releasedPlugins = plugins;
  };

  Client.prototype.getAllPlugins = function() {
    var list = [];
    for (var i = 0; i < this.installedPlugins; i++) {
      var plugin = this.installedPlugins[i];
      plugin.installed = true;
    }
  };

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

  Client.prototype.discoverPlugins = function(callback) {
    var builder = new dConnect.URIBuilder();
    builder.setProfile('system');
    if (this.settings.accessToken) {
      builder.setAccessToken(this.settings.accessToken);
    }
    dConnect.get(builder.build(), null, function(json) {
      callback.onsuccess(json);
    }, function(errorCode, errorMessage) {
      callback.onerror(errorCode, errorMessage);
    });
  };

  Client.prototype.getLastKnownDevices = function() {
    return this.lastKnownDevices;
  };

  Client.prototype.discoverDevices = function(callback) {
    var self = this;

    dConnect.discoverDevices(self.settings.accessToken, function(json) {
      this.lastKnownDevices = json.services;
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

  Client.prototype.connectWebSocket = function(cb) {
    dConnect.connectWebSocket(this.settings.clientId, cb);
  };

  Client.prototype.isConnectedWebSocket = function() {
    return dConnect.isConnectedWebSocket();
  }

  Client.prototype.disconnectWebSocket = function() {
    dConnect.disconnectWebSocket();
  }

  return parent;
})();
