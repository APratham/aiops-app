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

  logout(): void {
    this.ipcRenderer.send('logout');
  }
}
