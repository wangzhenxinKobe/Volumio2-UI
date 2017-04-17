class SocketService {
  constructor($rootScope, $http, $window, $log, $q, $timeout) {
    'ngInject';
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.$window = $window;
    this.$log = $log;
    this.$q = $q;
    this.$timeout = $timeout;

    this.hosts = undefined;
    this._host = undefined;
    this.socketType = 'socket';
    this.myVolumio = undefined;
  }

  initVolumio() {
    let localhostApiURL = `//${this.$window.location.hostname}/api`;
    return this.$http.get(localhostApiURL + '/host')
      .then((response) => {
        console.info('IP from API', response);
        this.$rootScope.initConfig = response.data;
        this.hosts = response.data;
        const firstHostKey = Object.keys(this.hosts)[0];
        this.host = this.hosts[firstHostKey];
      }, () => {
        //Fallback socket
        console.info('Dev mode: IP from local-config.json');
        return this.$http.get('/app/local-config.json').then((response) => {
          // const hosts = {
          //   'host1': 'http://192.168.0.65',
          //   'host2': 'http://192.168.0.66',
          //   'host3': 'http://192.168.0.67'};
          this.hosts = {'devHost': response.data.localhost};
          const firstHostKey = Object.keys(this.hosts)[0];
          this.host = this.hosts[firstHostKey];
        });
      });
  }

  initMyVolumio() {
    const config = {
      url: 'wss://dev-my.volumio.org/',
      name: 'volumio-frontend',
      type: window.wipeer.client.type.BROWSER
    };
    this.myVolumio = new window.myvolumio.Frontend(config);
    this.socketType = 'cloud';
    return this._connectMyVolumio();
  }

  _connectMyVolumio() {
    const $q = this.$q.defer();
    // TODO use token contained in cookie
    const credentials = {
      username: 'account1',
      password: 'password1'
    };
    this.myVolumio.on('cloud:connect', (resp) => {
      this.$log.debug('Connected to cloud', this.myVolumio.backends);
      this.hosts = this.myVolumio.backends;
      this.host = this.hosts[0];
      $q.resolve(this.myVolumio.backends);
    });
    this.myVolumio.connect(credentials);
    return $q.promise;
  }

  changeHost() {
    if (this.$window.socket) {
      this.$window.socket.disconnect();
      this.$window.socket.removeAllListeners && this.$window.socket.removeAllListeners();
    }
    if (this.socketType === 'socket') {
      this.$window.socket = io(this.host, {timeout: 500});
      this._handleConnection();
      this.$window.socket.connect();
    } else if (this.socketType === 'cloud') {
      this.$window.socket = this.myVolumio.io;
      this._handleConnection();
      this.$window.socket.connect(this.host.id);
    }
  }

  _handleConnection() {
    this.$window.socket.on('connect_error', () => {
      this.$log.debug(`Socket connect_error for host ${this.host}`);
      if (this.socketType === 'socket') {
        this._connectToNextHost();
      }
    });
    this.$window.socket.on('connect_timeout', () => {
      this.$log.debug(`Socket connect_timeout for host ${this.host}`);
      if (this.socketType === 'socket') {
        this._connectToNextHost();
      }
    });

    this.$window.socket.on('connect', () => {
      this.$timeout(()=> {
        this.$rootScope.$emit('socket:init');
      }, 100);
    });
  }

  _connectToNextHost() {
    if (this.socketType === 'socket') {
      const hostKeys = Object.keys(this.hosts);
      if (hostKeys.length > 1) {
        let currentHostIndex = hostKeys.findIndex(host => {
          return this.hosts[host] === this.host;
        });
        if (++currentHostIndex >= hostKeys.length) {
          currentHostIndex = 0;
        }
        const newHost = this.hosts[hostKeys[currentHostIndex]];
        this.$log.info(`Try to connect to host: ${hostKeys[currentHostIndex]}: ${newHost}`);
        this.host = newHost;
      }
    } else if (this.socketType === 'cloud') {
      // TODO is the cloud to try the connection with the next host?
    }
  }

  get isConnected() {
    return this.$window.socket.connected;
  }

  on(eventName, callback) {
    // this.$log.debug('on', eventName);
    return this.$window.socket.on(eventName, (data) => {
      //this.$log.debug(arguments);
      //this.$log.debug(data);
      this.$rootScope.$apply(function() {
        if (callback) {
          //this.$log.debug(data);
          //callback.apply(socket, data);
          callback(data);
        }
      });
    });
  }

  off(eventName, fn) {
    // this.$log.debug('off', eventName);
    this.$window.socket.off(eventName, fn);
  }

  emit(eventName, data, callback) {
    //this.$log.debug('emit', eventName);
    this.$window.socket.emit(eventName, data, (data) => {
      //let arg = arguments;
      this.$rootScope.$apply(function() {
        if (callback) {
          //callback.apply(socket, arg);
          callback(data);
        }
      });
    });
  }

  connect(callback) {
    this.$window.socket.on('connect', () => {
      this.$log.debug(`Socket connected to`, this.host);
      callback();
    });
  }

  reconnect(callback) {
    this.$window.socket.on('reconnect', () => {
      this.$log.debug('Socket reconnect');
      this.$rootScope.$emit('socket:reconnect');
      callback();
    });
  }

  disconnect(callback) {
    this.$window.socket.on('disconnect', (socket) => {
      this.$log.debug('Socket disconnect');
      callback(socket);
    });
  }

  set host(host) {
    this._host = host;
    this.changeHost();
    this.$log.debug(`New host:`, this.host);
  }

  get host() {
    return this._host;
  }
}

export default SocketService;
