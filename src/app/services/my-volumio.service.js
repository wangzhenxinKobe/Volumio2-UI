class MyVolumioService {
  constructor(socketService, $log, $cookies, $http) {
    'ngInject';
    this.socketService = socketService;
    this.$cookies = $cookies;
    this.$http = $http;
    this.$log = $log;
    this.user = undefined;
    this.myVolumioApi = 'https://hxsvfyc5cs2g5pc89-mock.stoplight-proxy.io/v1';
    // $rootScope.$on('socket:init', () => {
    //   this.init();
    // });
    // $rootScope.$on('socket:reconnect', () => {
    //   this.initService();
    // });
  }

  get isLogged() {
     const loginCookie = this.$cookies.get('myVolumio:auth');
     if (loginCookie) {
        // TODO check token expire date
       if (!this.user) {
        this.getUserProfile();
       }
      return JSON.parse(loginCookie);
     }
     return false;
  }

  getUserProfile() {
    return this.$http.get(`${this.myVolumioApi}/users/profile`)
      .then((response) => {
        this.user = response.data.payload.user;
      }, (error) => {
        this.$log.error('getUserProfile', error);
      });
  }

  signUp(user) {
    return this.$http.post(`${this.myVolumioApi}/users`, user)
      .then((response) => {
        this.addLoginCookie(response.data.payload.token);
        this.getUserProfile();
      }, (error) => {
        this.$log.error('signIn', error);
      });
  }

  signIn(user) {
    return this.$http.get(`${this.myVolumioApi}/users/login`, user)
      .then((response) => {
        this.addLoginCookie(response.data.payload.token);
        this.getUserProfile();
      }, (error) => {
        this.$log.error('signIn', error);
      });
  }

  forgotPassword(email) {
    return this.$http.get(`${this.myVolumioApi}/users/forgot-password`, {email})
      .then((response) => {
        this.addLoginCookie(response.data.payload.token);
      }, (error) => {
        this.$log.error('forgotPassword', error);
      });
  }

  addLoginCookie(token) {
    this.$cookies.putObject('myVolumio:auth', {token});
  }

  signOut() {
    this.$cookies.remove('myVolumio:auth');
    this.user = undefined;
    // TODO disconnect the ui from PI?
  }

  // init() {
  //   this.registerListner();
  //   this.initService();
  // }

  // registerListner() {
  //   this.socketService.on('updateReady', (data) => {
  //     this.$log.debug('updateReady', data);
  //     this.updateReady = data;
  //     this.openUpdateModal();
  //   });
  // }

  // initService() {
  // }
}

export default MyVolumioService;
