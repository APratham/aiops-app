import { Component, OnInit } from '@angular/core';
import { ContainerService } from '../container.service';
import { PopoverController } from '@ionic/angular';
import { ChoiceInfoPopoverComponent } from './choice-info-popover/choice-info-popover.component';

interface Container {
  id: string;
  name: string;
  status: string;
  created: string;
  image: string[];
  ports: any;
  state: any;
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
  selectedContainer: Container | null = null;

  constructor(
    private popoverController: PopoverController,
    private containerService: ContainerService
  ) {}

  ngOnInit() {
    this.loadContainers(this.selectedType);
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectType(type: string) {
    this.selectedType = type;
    this.dropdownOpen = false;
    this.loadContainers(type);
  }

  loadContainers(type: string) {
    if (type === 'Docker') {
      this.containerService.getAllDockerContainerDetails().subscribe(containers => {
        this.containers = containers;
      });
    } else if (type === 'Kubernetes') {
      // Similar logic for Kubernetes
    }
  }

  selectContainerItem(container: Container) {
    if (this.selectedContainer && this.selectedContainer.name === container.name) {
      this.selectedContainer = null;  // Unselect the container
    } else {
      this.selectedContainer = container;  // Otherwise, select the container
    }
  }

  async presentPopover(event: Event, container: Container) {
    this.selectedContainer = container;

    const popover = await this.popoverController.create({
      component: ChoiceInfoPopoverComponent,
      componentProps: {
        containerName: container.name,
        containerStatus: container.status,
        containerCreated: container.created,
        containerId: container.id,
        containerInfo: JSON.stringify(container, null, 2) // Pass the full container info as a formatted JSON string
      },
      event,
      translucent: true,
    });
    return await popover.present();
  }

  isContainerSelected(container: Container): boolean {
    return !!(this.selectedContainer && this.selectedContainer.name === container.name);
  }

  selectContainer() {
    if (this.selectedContainer) {
      window.electron.ipcRenderer.send('container-selected', {
        name: this.selectedContainer.name,
        id: this.selectedContainer.id,
        type: this.selectedType,
      });

      window.electron.ipcRenderer.send('close-window');
    } else {
      console.log('No container selected');
    }
  }
}
