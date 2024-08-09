import { Component, OnInit } from '@angular/core';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

const { ipcRenderer } = window.require('electron');


@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {

  ngOnInit(): void {
    const logoutButton = document.querySelector('ion-button#logout');

    logoutButton?.addEventListener('click', () => {
      ipcRenderer.send('logout');
    });

    ipcRenderer.on('logout-success', () => {
      window.location.href = '/login';  // Update the path to Angular routing
    });
  }
}
