import { Component, Input, OnInit } from '@angular/core';
import { NavController, MenuController, PopoverController } from '@ionic/angular';  // Ensure correct imports
import { UserInfoService } from '../user-info.service';
import { Inject } from '@angular/core';

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

  constructor(
    private userInfoService: UserInfoService,
    private menu: MenuController,
    private popoverCtrl: PopoverController
  ) {}

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

  async presentPopover(ev: any) {
    if (!ev) {
      console.error("Popover event is null or undefined, cannot present popover.");
      return;
    }

    const popover = await this.popoverCtrl.create({
      component: PopoverContentDynamicComponent,
      event: ev,
      translucent: true,
      cssClass: 'popover-menu'
    });

    if (popover) {
      await popover.present();
    } else {
      console.error("Popover creation failed, popover is null or undefined.");
    }
  }

  navigateTo(route: string) {
    // Implement navigation logic
  }

  logout() {
    // Implement logout logic
  }
}

@Component({
  template: `
    <ion-list>
      <ion-item (click)="navigateTo('/profile')">Profile</ion-item>
      <ion-item (click)="navigateTo('/settings')">Settings</ion-item>
      <ion-item (click)="logout()">Logout</ion-item>
    </ion-list>
  `
})
export class PopoverContentDynamicComponent {
  constructor(
    @Inject(NavController) private navCtrl: NavController,
    @Inject(PopoverController) private popoverCtrl: PopoverController
  ) {}

  navigateTo(route: string) {
    this.navCtrl.navigateForward(route);
    this.popoverCtrl.dismiss();
  }

  logout() {
    // Implement logout logic
    this.popoverCtrl.dismiss();
  }
}
