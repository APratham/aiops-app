import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardStateService {
  private isDashboardSubject = new BehaviorSubject<boolean>(false);
  isDashboard$ = this.isDashboardSubject.asObservable();

  constructor(private router: Router) {
    // Listen to router events and check if the current URL is 'dashboard'
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const isDashboard = this.router.url.includes('dashboard');
        this.isDashboardSubject.next(isDashboard);
      }
    });
  }
}
