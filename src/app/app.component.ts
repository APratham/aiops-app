import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { ElectronService } from './electron.service';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  showTopBar = true;  // Control visibility of the top bar
  userInfo: any;

  constructor(
    private router: Router,
    private titleService: Title,
    private electronService: ElectronService
  ) {}

  ngOnInit() {
    // Set up router events to update the title and show/hide the top bar
    this.router.events
      .pipe(
        filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        const currentRoute = this.router.routerState.snapshot.root;
        const title = this.getTitle(currentRoute);
        this.titleService.setTitle(title);
  
        // Update the visibility of the top bar based on the current route
        this.showTopBar = this.shouldShowTopBar(event.urlAfterRedirects);
  
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

  shouldShowTopBar(url: string): boolean {
    const hideOnRoutes = ['/choicewindow'];
    return !hideOnRoutes.includes(url);
  }
}