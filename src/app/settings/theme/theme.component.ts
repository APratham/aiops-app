// theme.component.ts
import { Component, OnInit, ChangeDetectorRef, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IonSelect } from '@ionic/angular';


@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html',
  styleUrls: ['./theme.component.scss'],
})

export class ThemeComponent implements OnInit {
  @ViewChild('ionSelect') ionSelect!: IonSelect;
  ipcRenderer = (window as any).electron.ipcRenderer;
  userSub: string | null = null;


  settings = {
    theme: 'light',
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    
        const userInfo = await this.getStoreValue('userInfo');
    if (userInfo && userInfo.sub) {
      this.userSub = userInfo.sub;
      console.log('User sub:', this.userSub);

      this.fetchSettings();
      console.log('Fetched settings:', this.settings);
    }
  }

  ngAfterViewInit() {

    // Ensure that ionSelect is available after the view is initialized by using ChangeDetectorRef
    this.cdr.detectChanges(); 
  }

  onThemeChange(event: any) {
    console.log('Theme changed to:', event.detail.value);
    this.settings.theme = event.detail.value;
    console.log('New settings:', this.settings);
    this.saveSettings();
  }

  async fetchSettings() {
    if (this.userSub) {
      try {
        const response: any = await this.http.get(`dal/getUserSettings/${this.userSub}`).toPromise();
        console.log('Fetched user settings:', response);
        if (response && response.theme) {
          this.settings.theme = response.theme; 
          this.ionSelect.value = this.settings.theme;
      
          this.cdr.detectChanges();
        }
      } catch (error) {
        console.error('Failed to fetch user settings:', error);
      }
    }
  }
  

  saveSettings() {
    if (this.userSub) {
      const payload = {
        sub: this.userSub,
        settings: { theme: this.settings.theme }, 
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
