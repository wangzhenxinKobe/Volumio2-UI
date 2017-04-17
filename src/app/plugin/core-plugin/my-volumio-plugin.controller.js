export default class MyVolumioPluginController {
  constructor(socketService, $log, myVolumioService, $state) {
    'ngInject';
    this.socketService = socketService;
    this.myVolumioService = myVolumioService;
    this.$state = $state;
    this.$log = $log;
    this.showSignUp = false;
    this.init();
  }

  init() {
    // This plugin have to switch between my volumio API REST or socket PI API connected via Hotspot
    this.isLogged = this.myVolumioService.isLogged;
  }

  submit() {
    if (this.userForm.$valid) {
      if (this.showSignUp) {
        this.signUp();
      } else if (this.resetPassword){
        this.forgotPassword();
      } else {
        this.signIn();
      }
    }
  }

  signUp() {
    this.myVolumioService.signUp(this.userForm)
      .then(() => {
        this.$state.go('volumio.playback', {}, {reload: true});
      });
  }

  signIn() {
    this.myVolumioService.signIn(this.userForm)
      .then(() => {
        this.$state.go('volumio.playback', {}, {reload: true});
      });
  }

  signOut() {
    this.myVolumioService.signOut();
    this.isLogged = false;
  }

  forgotPassword() {
    this.myVolumioService.forgotPassword(this.userForm.forgotEmail);
  }
}
