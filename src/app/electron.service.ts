import { Injectable } from '@angular/core';
import { IpcRenderer, IpcRendererEvent } from 'electron';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer!: IpcRenderer;

  constructor() {
    if (this.isElectron()) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
    }
  }

  isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  // Example method to retrieve user info
  getUserInfo(callback: (userInfo: any) => void) {
    if (this.isElectron()) {
      this.ipcRenderer.on('user-info', (event: IpcRendererEvent, data: any) => {
        callback(data);
      });
    }
  }
}
