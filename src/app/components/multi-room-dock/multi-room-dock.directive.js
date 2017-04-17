class MultiRoomDockDirective {
  constructor(themeManager) {
    'ngInject';
    let directive = {
      restrict: 'E',
      templateUrl: themeManager.getHtmlPath('multi-room-dock', 'components/multi-room-dock'),
      scope: false,
      controller: MultiRoomDockController,
      controllerAs: 'multiRoomDock',
      bindToController: true
    };
    return directive;
  }
}

class MultiRoomDockController {
  constructor($rootScope, socketService, multiRoomService, themeManager, isUiInCloud) {
    'ngInject';
    this.socketService = socketService;
    this.multiRoomService = multiRoomService;
    this.isUiInCloud = isUiInCloud;
  }

  changeDevice(device, index) {
    if (!device.isChild && !device.isSelf) {
      // FIXME
      console.info(device.host, this.multiRoomService.devices);
      if (this.isUiInCloud) {
        // console.info(this.socketService.hosts);
        this.socketService.host = this.socketService.hosts[index];
      } else {
        this.socketService.host = device.host;
      }
    }
  }
}

export default MultiRoomDockDirective;
