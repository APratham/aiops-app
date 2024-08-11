import { Component, OnInit } from '@angular/core';
import { ElectronService } from './electron.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  userInfo: any;

  constructor(private electronService: ElectronService) {}

  ngOnInit() {
    if (this.electronService.isElectron()) {
      // Handle app start event
      this.electronService.onAppStart((data) => {
        if (data.isLoggedIn) {
          console.log('User is logged in with sub:', data.sub);

          // Query Electron Store for user session data
          this.electronService.electronStore.get('user_session').then((sessionData) => {
            console.log('Session Data from Electron Store:', sessionData);
            if (sessionData) {
              this.userInfo = sessionData;
              console.log(`User ${sessionData.name} logged in with profile picture: ${sessionData.picture}`);
            }
          });
        } else {
          console.log('No user is logged in');
        }
      });

      // Handle user session data event (for login)
      this.electronService.onUserSessionData((sessionData) => {
        console.log('Received session data:', sessionData);
        this.userInfo = sessionData;
      });
    }
  }
}
