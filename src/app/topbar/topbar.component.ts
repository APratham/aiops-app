import { Component, Input, OnInit } from '@angular/core';
import { UserInfoService } from '../user-info.service';

@Component({
  selector: 'app-top-bar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopBarComponent implements OnInit {
  @Input() title: string = 'Default Title';
  @Input() logo: string = '/assets/logo.svg';
  profilePic: string = 'assets/profile/avatar.jpg';

  constructor(private userInfoService: UserInfoService) {}

  ngOnInit() {
    const userInfo = this.userInfoService.getUserInfo();
    if (userInfo && userInfo.picture) {
      this.profilePic = userInfo.picture;
    } else if (window.electron && window.electron.ipcRenderer) {
      this.profilePic = window.electron.ipcRenderer.sendSync('get-profile-pic') as string;
    }

    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.on('user-info', (event, userInfo) => {
        if (userInfo && userInfo.picture) {
          this.profilePic = userInfo.picture;
          this.userInfoService.saveUserInfo(userInfo);
        }
      });
    }
  }
}
