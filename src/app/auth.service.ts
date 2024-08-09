import { Injectable } from '@angular/core';
import { IpcRendererEvent } from 'electron';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  ipcRenderer = (window as any).electron.ipcRenderer;

  constructor() {}

  isLoggedIn(): Promise<boolean> {
    return new Promise((resolve) => {
      this.ipcRenderer.once('auth-status', (event: IpcRendererEvent, isLoggedIn: boolean) => {
        resolve(isLoggedIn);
      });
      this.ipcRenderer.send('check-auth-status');
    });
  }

  startLogin(provider: 'google' | 'microsoft'): void {
    this.ipcRenderer.send('auth-start', provider);
  }

  onLoginSuccess(callback: (data: { tokens: any, uniqueId: string }) => void): void {
    this.ipcRenderer.on('auth-success', (event: IpcRendererEvent, data: any) => {
      callback(data);
    });
  }

  logout(): void {
    this.ipcRenderer.send('logout');
  }
}
