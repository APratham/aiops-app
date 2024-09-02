import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IpcRendererEvent } from 'electron';
 
interface ApiResponse {
  message: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnInit {


  containerData: any;

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {


    window.electron.ipcRenderer.on('container-data', (event, data) => {
      this.containerData = data;
      console.log('Received container data:', this.containerData);
    });

  

  

 



  }


  
}