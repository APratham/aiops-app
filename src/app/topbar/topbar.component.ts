import { Component, Input, OnInit } from '@angular/core';
import { UserInfoService } from '../user-info.service';

@Component({
  selector: 'app-top-bar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopBarComponent implements OnInit {
  @Input() title: string = 'Default Title';
  @Input() logo: string = '/assets/logo.svg'; // Path to a dummy SVG for now
  profilePic: string = 'assets/profile/avatar.jpg'; // Default avatar

  constructor(private userInfoService: UserInfoService) {}

  ngOnInit() {
    const userInfo = this.userInfoService.getUserInfo();
    if (userInfo && userInfo.picture) {
      this.profilePic = userInfo.picture; // Update with the actual profile picture URL
    }

    // Listen to changes in userInfo (in case the data arrives after the component is initialized)
    if (window.electron) {
      window.electron.ipcRenderer.on('user-info', (event, userInfo) => {
        if (userInfo && userInfo.picture) {
          this.profilePic = userInfo.picture;
        }
      });
    }
  }
}