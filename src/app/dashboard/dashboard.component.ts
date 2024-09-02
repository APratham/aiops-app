import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  idToken: string | null = null;
  containerData: any;

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    const logoutButton = document.querySelector('ion-button#logout');
    const callApiButton = document.querySelector('ion-button#callapi');

    window.electron.ipcRenderer.on('container-data', (event, data) => {
      this.containerData = data;
      console.log('Received container data:', this.containerData);
    });

    window.electron.ipcRenderer.on('navigate-to-dashboard', () => {
      this.router.navigate(['/dashboard']);
    });

    // Fetch the value from electron-store
    this.getStoreValue('googleTokens').then((value) => {
      if (value && value.id_token) {
        this.idToken = value.id_token;
        console.log('Access token:', this.idToken);
      } else {
        console.warn('No access token found in googleTokens');
      }
    });

    // Setup API call with the token
    callApiButton?.addEventListener('click', () => {
      if (this.idToken) {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${this.idToken}`
        });

        this.http.get<ApiResponse>('http://localhost:3000/api/docker-containers/id/94bee64ab0fa', { headers })
          .subscribe({
            next: (response: any) => {
              console.log('API response:', response);
            },
            error: (error: any) => {
              console.error('API error:', error);
            }
          });
      } else {
        console.error('No access token available. Cannot make the API call.');
      }
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

  async getStoreValue(key: string): Promise<any> {
    try {
      const value = await (window as any).electron.ipcRenderer.invoke('get-store-value', key);
      if (value === undefined) {
        console.warn(`No value found in electron-store for key: ${key}`);
      }
      return value;
    } catch (error) {
      console.error('Failed to get value from electron-store:', error);
      return null;
    }
  }
  
}