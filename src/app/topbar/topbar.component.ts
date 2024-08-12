import { Component, Input, OnInit, Inject } from '@angular/core';
import { NavController, MenuController, PopoverController } from '@ionic/angular';
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
  ipcRenderer = (window as any).electron.ipcRenderer;

  constructor(
    private userInfoService: UserInfoService,
    private menu: MenuController,
    private popoverCtrl: PopoverController,
    private navCtrl: NavController  // Inject NavController for navigation
  ) {}

  ngOnInit() {
    this.userInfo = this.userInfoService.getUserInfo();

    if (this.userInfo && this.userInfo.picture) {
      this.profilePic = this.userInfo.picture;
    } else if (this.ipcRenderer) {
      this.profilePic = this.ipcRenderer.sendSync('get-profile-pic') as string;
    }

    if (this.ipcRenderer) {
      this.ipcRenderer.on('user-info', (event: any, userInfo: any) => {
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
    this.navCtrl.navigateForward(route);
  }

  logout() {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('logout');

      // Wait for the logout-success event from Electron
      this.ipcRenderer.once('logout-success', () => {
        this.navCtrl.navigateRoot('/login');  // Navigate to the login page
      });
    }
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
  ipcRenderer = (window as any).electron.ipcRenderer;

  constructor(
    @Inject(NavController) private navCtrl: NavController,
    @Inject(PopoverController) private popoverCtrl: PopoverController
  ) {}

  navigateTo(route: string) {
    this.navCtrl.navigateForward(route);
    this.popoverCtrl.dismiss();
  }

  logout() {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('logout');

      // Wait for the logout-success event from Electron
      this.ipcRenderer.once('logout-success', () => {
        this.navCtrl.navigateRoot('/login');  // Navigate to the login page
      });
    }
    this.popoverCtrl.dismiss();
  }
}
