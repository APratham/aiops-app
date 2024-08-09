import { Component, OnInit } from '@angular/core';
import { IpcRendererEvent } from 'electron'; // Importing the IpcRendererEvent type

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  ipcRenderer = (window as any).electron.ipcRenderer;

  constructor() { }

  ngOnInit(): void {
    const googleLoginButton = document.querySelector('ion-button#google-login');
    const microsoftLoginButton = document.querySelector('ion-button#microsoft-login');

    googleLoginButton?.addEventListener('click', () => {
      googleLoginButton.setAttribute('disabled', 'true');
      this.ipcRenderer.send('auth-start', 'google');
    });

    microsoftLoginButton?.addEventListener('click', () => {
      microsoftLoginButton.setAttribute('disabled', 'true');
      this.ipcRenderer.send('auth-start', 'microsoft');
    });

    this.ipcRenderer.on('auth-success', (event: IpcRendererEvent, data: any) => {
      const { uniqueId } = data;
      window.location.href = `index.html?uniqueId=${uniqueId}`;
    });

    this.ipcRenderer.on('auth-window-closed', () => {
      googleLoginButton?.removeAttribute('disabled');
      microsoftLoginButton?.removeAttribute('disabled');
    });

    this.ipcRenderer.on('logout-success', () => {
      window.location.href = 'login.html';
    });
  }
}
