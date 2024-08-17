import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IpcRendererEvent } from 'electron';

interface ApiResponse {
  message: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  ipcRenderer = (window as any).electron.ipcRenderer;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    const logoutButton = document.querySelector('ion-button#logout');
    const callApiButton = document.querySelector('ion-button#callapi');

    callApiButton?.addEventListener('click', () => {
      this.http.get<ApiResponse>('http://localhost:8000/test-endpoint', { observe: 'response' })
      .subscribe({
        next: (response) => {
          console.log(response);
        },
        error: (error) => {
          console.error('Error: ', error);
        }
      });
    });

    this.ipcRenderer.on('auth-success', (event: IpcRendererEvent, data: any) => {
      const { uniqueId } = data;
      const statusElement = document.getElementById('status');
      if (statusElement) {
        statusElement.innerText = `Login successful! Your unique ID: ${uniqueId}`;
      }
      this.ipcRenderer.send('validate-token', data.tokens);
    });

    this.ipcRenderer.on('token-validity', (event: IpcRendererEvent, isValid: boolean) => {
      const statusText = isValid ? 'Token is valid and verified!' : 'Token validation failed.';
      const tokenStatusElement = document.getElementById('token-status');
      if (tokenStatusElement) {
        tokenStatusElement.innerText = statusText;
      }
    });

    this.ipcRenderer.on('logout-success', () => {
      window.location.href = '/login';  // Use Angular routing path
    });

    // Check if already logged in
    this.ipcRenderer.send('check-login');

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