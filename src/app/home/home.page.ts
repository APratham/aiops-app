import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
//import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
//import { ipcRenderer } from 'electron';

// Define a response type that matches what you expect from your backend
interface ApiResponse {
  data: string;  // Adjust based on the actual data structure you expect in response
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  userData: string = '';

  constructor(private http: HttpClient, private toastController: ToastController) {}

  // Function to present toast messages for feedback
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000
    });
    toast.present();
  }

  // Function to send data to the backend
  sendData() {
    // Trim and check if userData is empty before sending
    if (!this.userData.trim()) {
      this.presentToast('Please enter some data before sending.');
      return;
    }

    // Adjust the URL to point to your specific backend endpoint
    this.http.post<ApiResponse>('http://localhost:8000/receive-data/', { data: this.userData })
      .subscribe({
        next: (response) => {
          console.log('Data sent successfully', response);
          // Optionally update userData with the response if needed
          this.userData = response.data; 
          this.presentToast('Data sent successfully!');
        },
        error: (error) => {
          console.error('Error sending data', error);
          this.presentToast('Error sending data. Please try again.');
        }
      });
  }
}