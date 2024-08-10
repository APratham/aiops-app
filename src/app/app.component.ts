import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ElectronService } from './electron.service';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { IpcRendererEvent } from 'electron';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  userInfo: any;

  constructor(
    private router: Router,
    private titleService: Title,
    private electronService: ElectronService
  ) {}

  ngOnInit() {
    // Set up router events to update the title
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const currentRoute = this.router.routerState.snapshot.root;
        const title = this.getTitle(currentRoute);
        this.titleService.setTitle(title);

        // Send the title to Electron to update the window title
        if (this.electronService.isElectron()) {
          this.electronService.ipcRenderer.send('update-title', title);
        }
      });


  }

  getTitle(routeSnapshot: any): string {
    let title = routeSnapshot.data['title'] || '';
    if (routeSnapshot.firstChild) {
      title = this.getTitle(routeSnapshot.firstChild) || title;
    }
    return title;
  }
}
