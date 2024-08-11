import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {
  private userInfo: any;

  constructor() {
    if (window.electron && window.electron.ipcRenderer) {
      this.userInfo = window.electron.ipcRenderer.sendSync('get-user-info') as any;
    }

    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.on('user-info', (event, userInfo) => {
        console.log('Received user info:', userInfo);
        this.userInfo = userInfo;
      });
    }
  }

  getUserInfo() {
    return this.userInfo;
  }

  saveUserInfo(userInfo: any) {
    this.userInfo = userInfo;
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send('save-user-info', userInfo);
    }
  }
}
