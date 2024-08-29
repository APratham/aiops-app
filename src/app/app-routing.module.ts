import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SettingsComponent } from './settings/settings.component';
import { AccountComponent } from './settings/account/account.component';
import { ApplicationComponent } from './settings/application/application.component';
import { ThemeComponent } from './settings/theme/theme.component';
import { ChoicewindowComponent } from './choicewindow/choicewindow.component';


import { AuthGuard } from './auth.guard';  // Import the AuthGuard
import { NotFoundGuard } from './not-found.guard'; 

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: { title: 'Login' }  // Set the title for the login page
  },
  {
    path: 'logout',
    component: LogoutComponent,  // Set the title for the logout page
  },
  {
    path: 'home',
    component: HomeComponent,
    data: { title: 'Home' },
    canActivate: [AuthGuard]  // Protect the home route with the AuthGuard
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    data: { title: 'Dashboard' },
    canActivate: [AuthGuard]  // Protect the dashboard route with the AuthGuard
  },
  {
    path: 'choicewindow',
    component: ChoicewindowComponent,
    data: { title: 'Choose container' },
    canActivate: [AuthGuard]  // Protect the dashboard route with the AuthGuard
  },
  {
    path: 'settings',
    component: SettingsComponent,
    data: { title: 'Settings' },
    canActivate: [AuthGuard],  // Protect the settings route with the AuthGuard
    children: [
      {
        path: 'account',
        component: AccountComponent,
        data: { title: 'Account' },
      },
      {
        path: 'application',
        component: ApplicationComponent,
        data: { title: 'Application' }, 
      },
      {
        path: 'theme',
        component: ThemeComponent,
        data: { title: 'Theme'},
      }  
    ]
  },
  {
    path: '',
    redirectTo: 'login',  // Redirect to the login page if no path is provided
    pathMatch: 'full'
  },
  {
    path: '**',
    canActivate: [NotFoundGuard] // Protect all other routes with the NotFoundGuard
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }