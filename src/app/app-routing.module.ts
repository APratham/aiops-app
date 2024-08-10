import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './auth.guard';  // Import the AuthGuard

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
    path: 'dashboard',
    component: DashboardComponent,
    data: { title: 'Dashboard' },
    canActivate: [AuthGuard]  // Protect the dashboard route with the AuthGuard
  },
  {
    path: '',
    redirectTo: 'login',  // Redirect to the login page if no path is provided
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login',  // Fallback route redirects to login for undefined routes
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
