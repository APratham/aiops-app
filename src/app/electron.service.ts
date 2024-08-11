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

  // Methods to interact with Electron Store
  electronStore = {
    get: (key: string) => {
      if (this.isElectron()) {
        return this.ipcRenderer.invoke('electron-store-get', key);
      }
      return Promise.resolve(null);
    },
    set: (key: string, value: any) => {
      if (this.isElectron()) {
        return this.ipcRenderer.invoke('electron-store-set', key, value);
      }
      return Promise.resolve();
    },
    clear: () => {
      if (this.isElectron()) {
        return this.ipcRenderer.invoke('electron-store-clear');
      }
      return Promise.resolve();
    },
    delete: (key: string) => {
      if (this.isElectron()) {
        return this.ipcRenderer.invoke('electron-store-delete', key);
      }
      return Promise.resolve();
    }
  };

  // Method to handle the app-start event
  onAppStart(callback: (data: any) => void) {
    if (this.isElectron()) {
      this.ipcRenderer.on('app-start', (event: IpcRendererEvent, data: any) => {
        callback(data);
      });
    }
  }

  // Method to handle user session data event
  onUserSessionData(callback: (data: any) => void) {
    if (this.isElectron()) {
      this.ipcRenderer.on('user-session-data', (event: IpcRendererEvent, data: any) => {
        callback(data);
      });
    }
  }
}
