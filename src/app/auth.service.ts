import { Injectable } from '@angular/core';
import { IpcRendererEvent } from 'electron';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private ipcRenderer = (window as any).electron?.ipcRenderer;

  constructor() {
    if (!this.ipcRenderer) {
      console.warn('ipcRenderer is not available. Make sure you are running inside Electron.');
    }
  }

  isLoggedIn(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.ipcRenderer) {
        reject('ipcRenderer is not initialized');
        return;
      }
      this.ipcRenderer.once('auth-status', (event: IpcRendererEvent, isLoggedIn: boolean) => {
        resolve(isLoggedIn);
      });
      this.ipcRenderer.send('check-auth-status');
    });
  }

  startLogin(provider: 'google' | 'microsoft'): void {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('auth-start', provider);
    } else {
      console.error('ipcRenderer is not initialized');
    }
  }

  onLoginSuccess(callback: (data: { tokens: any, uniqueId: string }) => void): void {
    if (this.ipcRenderer) {
      this.ipcRenderer.on('auth-success', (event: IpcRendererEvent, data: any) => {
        callback(data);
      });
    } else {
      console.error('ipcRenderer is not initialized');
    }
  }

  logout(): void {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('logout');
    } else {
      console.error('ipcRenderer is not initialized');
    }
  }
}
