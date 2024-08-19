import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class NotFoundGuard implements CanActivate {

  constructor(private router: Router, private toastController: ToastController) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const validRoute = this.router.config.some(r => state.url === `/${r.path}`);
    if (!validRoute) {
      await this.presentToast(`Route ${state.url} not found.`);
      return false;  // Prevent navigation, keeping the user on the current page
    }
    return true;  // Allow navigation
  }

  private async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}
