import { Component, Input, OnInit, Inject } from '@angular/core';
import { NavController, MenuController, PopoverController } from '@ionic/angular';
import { UserInfoService } from '../user-info.service';
import { DashboardStateService } from '../dashboard-state.service';


@Component({
  selector: 'app-top-bar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopBarComponent implements OnInit {
  @Input() title: string = 'AIOps Container Monitoring';
  @Input() logo: string = '/assets/icon/aiops-bg.png';
  profilePic: string = 'assets/profile/avatar.jpg';
  userInfo: any = null;
  isDashboard: boolean = false;

  ipcRenderer = (window as any).electron.ipcRenderer;

  constructor(
    private userInfoService: UserInfoService,
    private menu: MenuController,
    private popoverCtrl: PopoverController,
    private navCtrl: NavController,  // Inject NavController for navigation
    private dashboardStateService: DashboardStateService
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

    this.dashboardStateService.isDashboard$.subscribe(isDashboard => {
      this.isDashboard = isDashboard;
    });
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
    // Add cases for the new routes you want to handle
    switch(route) {
      case '/dashboards':
        this.navCtrl.navigateForward('/dashboards');
        break;
      case '/alarms':
        this.navCtrl.navigateForward('/alarms');
        break;
      case '/insights':
        this.navCtrl.navigateForward('/insights');
        break;
      case '/events':
        this.navCtrl.navigateForward('/events');
        break;
      default:
        this.navCtrl.navigateForward(route);
    }
  }

  onNotificationClick() {
    // Navigate to the notifications page or handle the notification logic
  }
  
  onHelpClick() {
    // Navigate to a help or FAQ page, or show a modal with help information
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
