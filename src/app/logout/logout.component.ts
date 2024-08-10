import { Component, OnInit } from '@angular/core';
import { IpcRendererEvent } from 'electron';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {

  ipcRenderer = (window as any).electron.ipcRenderer;

  constructor() { }

  ngOnInit(): void {
    const logoutButton = document.querySelector('ion-button#logout');

    logoutButton?.addEventListener('click', () => {
      this.ipcRenderer.send('logout');
    });

    this.ipcRenderer.on('logout-success', (event: IpcRendererEvent) => {
      window.location.href = '/login';  // Update the path to Angular routing
    });
  }
}