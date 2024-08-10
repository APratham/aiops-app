import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {
  private userInfo: any;

  constructor() {
    if (window.electron) {
      window.electron.ipcRenderer.on('user-info', (userInfo) => {
        console.log('Received user info:', userInfo);
        this.userInfo = userInfo;
      });
    }
  }

  getUserInfo() {
    return this.userInfo;
  }
}