import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { ChoiceInfoPopoverComponent } from './choice-info-popover/choice-info-popover.component';

interface Container {
  name: string;
  status: string;
  created: string;
  info: string;
}

@Component({
  selector: 'app-choicewindow',
  templateUrl: './choicewindow.component.html',
  styleUrls: ['./choicewindow.component.scss']
})

export class ChoicewindowComponent implements OnInit {
  containers: Container[] = [];
  selectedType: string = 'Docker';  // Default selected type
  dropdownOpen: boolean = false;

  constructor(private popoverController: PopoverController) {}

  ngOnInit() {
    this.containers = [
      { name: 'Container 1', status: 'Running', created: '2024-08-01', info: 'Docker container running on port 8080' },
      { name: 'Container 2', status: 'Stopped', created: '2024-08-02', info: 'Stopped container for web server' },
      { name: 'Container 3', status: 'Paused', created: '2024-08-03', info: 'Paused container for database' }
    ];
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectType(type: string) {
    this.selectedType = type;
    this.dropdownOpen = false;
  
    if (type === 'Docker') {
      this.containers = [
        { name: 'Container 1', status: 'Running', created: '2024-08-01', info: 'Docker container running on port 8080' },
        { name: 'Container 2', status: 'Stopped', created: '2024-08-02', info: 'Stopped container for web server' },
        { name: 'Container 3', status: 'Paused', created: '2024-08-03', info: 'Paused container for database' }
      ];
    } else if (type === 'Kubernetes') {
      this.containers = [
        { name: 'Kube 1', status: 'Running', created: '2024-08-01', info: 'Kubernetes pod running on port 9090' },
        { name: 'Kube 2', status: 'Stopped', created: '2024-08-02', info: 'Stopped pod for microservice' },
        { name: 'Kube 3', status: 'Paused', created: '2024-08-03', info: 'Paused pod for backend service' }
      ];
    }
  }
  

  async presentPopover(event: Event, container: Container) {
    const popover = await this.popoverController.create({
      component: ChoiceInfoPopoverComponent,
      componentProps: {
        containerName: container.name,
        containerStatus: container.status,
        containerCreated: container.created,
        containerInfo: container.info
      },
      event,
      translucent: true,
    });
    return await popover.present();
  }
}
