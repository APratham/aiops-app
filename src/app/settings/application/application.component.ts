import { Component, OnInit, ChangeDetectorRef, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IonToggle } from '@ionic/angular';

@Component({
  selector: 'app-application',
  templateUrl: './application.component.html',
  styleUrls: ['./application.component.scss'],
})
export class ApplicationComponent implements OnInit, AfterViewInit {
  @ViewChild('ionDockerToggle') ionDockerToggle!: IonToggle;
  ipcRenderer = (window as any).electron.ipcRenderer;
  userSub: string | null = null;

  settings = {
    notifications: '0',
    docker: '1',
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    const userInfo = await this.getStoreValue('userInfo');
    if (userInfo && userInfo.sub) {
      this.userSub = userInfo.sub;
      console.log('User sub:', this.userSub);

      await this.fetchSettings();
    }
  }

  async ngAfterViewInit() {
    console.log('ngAfterViewInit: Checking toggle state after view initialization.');
    this.updateDockerToggle(); // Ensure the toggle is updated after the view is initialized
  }

  onToggle(event: any) {
    console.log('Docker Toggle is now changed to:', event.detail.checked);
    this.settings.docker = event.detail.checked ? '1' : '0'; // Convert boolean to '1' or '0'
    console.log('New settings:', this.settings);
    this.saveSettings();
  }  

  async fetchSettings() {
    if (this.userSub) {
      try {
        const response: any = await this.http.get(`dal/getUserSettings/${this.userSub}`).toPromise();
        console.log('Fetched user settings:', response);
        if (response && response.docker !== undefined) {
          this.settings.docker = response.docker.toString(); // Ensure it is a string '1' or '0'
          console.log('Updated settings after fetch:', this.settings);
          this.updateDockerToggle(); // Update the toggle state
        }
      } catch (error) {
        console.error('Failed to fetch user settings:', error);
      }
    }
  }

  updateDockerToggle() {
    if (this.ionDockerToggle) {
      console.log('Updating Docker toggle state to:', this.settings.docker === '1');
      this.ionDockerToggle.checked = this.settings.docker === '1'; // Set the toggle's checked state
      this.cdr.detectChanges(); // Trigger change detection to reflect changes in the view
      console.log('Toggle state updated:', this.ionDockerToggle.checked);
    } else {
      console.warn('ionDockerToggle is not available in updateDockerToggle.');
    }
  }

  saveSettings() {
    if (this.userSub) {
      const payload = {
        sub: this.userSub,
        settings: { docker: this.settings.docker }, // Ensure this is '0' or '1'
      };
      console.log('Saving settings:', payload);
  
      this.http.post('dal/saveUserSettings', payload, { responseType: 'text' }).subscribe(
        (response) => {
          try {
            const jsonResponse = JSON.parse(response);
            console.log('Settings saved successfully:', jsonResponse);
          } catch (e) {
            console.log('Settings saved successfully:', response);
          }
        },
        (error) => console.error('Failed to save settings:', error)
      );
    } else {
      console.warn('User sub is not available, cannot save settings');
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
