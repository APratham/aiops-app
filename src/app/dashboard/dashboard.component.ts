import { Component, OnInit } from '@angular/core';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

const { ipcRenderer } = window.require('electron');

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  ngOnInit(): void {
    const logoutButton = document.querySelector('ion-button#logout');

    logoutButton?.addEventListener('click', () => {
      ipcRenderer.send('logout');
    });

    ipcRenderer.on('auth-success', (event, data) => {
      const { uniqueId } = data;
      const statusElement = document.getElementById('status');
      if (statusElement) {
        statusElement.innerText = `Login successful! Your unique ID: ${uniqueId}`;
      }
      ipcRenderer.send('validate-token', data.tokens);
    });

    ipcRenderer.on('token-validity', (event, isValid) => {
      const statusText = isValid ? 'Token is valid and verified!' : 'Token validation failed.';
      const tokenStatusElement = document.getElementById('token-status');
      if (tokenStatusElement) {
        tokenStatusElement.innerText = statusText;
      }
    });

    ipcRenderer.on('logout-success', () => {
      window.location.href = '/login';  // Use Angular routing path
    });

    // Check if already logged in
    ipcRenderer.send('check-login');

    // Check if the URL contains query parameters with login data
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('uniqueId')) {
      const uniqueId = urlParams.get('uniqueId');
      const statusElement = document.getElementById('status');
      if (statusElement) {
        statusElement.innerText = `Login successful! Your unique ID: ${uniqueId}`;
      }
    }
  }
}
