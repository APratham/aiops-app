import { Component, Input, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
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
  userInfo: any = null;

  constructor(private userInfoService: UserInfoService, private menu: MenuController) {}

  ngOnInit() {
    this.userInfo = this.userInfoService.getUserInfo();

    if (this.userInfo && this.userInfo.picture) {
      this.profilePic = this.userInfo.picture;
    } else if (window.electron && window.electron.ipcRenderer) {
      this.profilePic = window.electron.ipcRenderer.sendSync('get-profile-pic') as string;
    }

    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.on('user-info', (event, userInfo) => {
        if (userInfo && userInfo.picture) {
          this.profilePic = userInfo.picture;
          this.userInfo = userInfo;
          this.userInfoService.saveUserInfo(userInfo);
        }
      });
    }
  }

  isAuthenticated(): boolean {
    return this.userInfo !== null;
  }

  openMenu() {
    this.menu.open('profileMenu');
  }
}
