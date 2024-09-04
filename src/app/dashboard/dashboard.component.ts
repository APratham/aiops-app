import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, CdkDragEnd, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface ContainerItem {
  content: string;
  transform?: string;  // To store the drag position
}


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  containerData: any;
  sideContainerItems: ContainerItem[] = [
    { content: 'Item 1' },
    { content: 'Item 2' },
  ];

  pageContainerItems: ContainerItem[] = [
    { content: 'Page Item 1' },
    { content: 'Page Item 2' },
  ];

  sideContainerVisible = true;

  toggleSideContainer(): void {
    this.sideContainerVisible = !this.sideContainerVisible;
  }

  onDrop(event: CdkDragDrop<ContainerItem[]>) {
    if (event.previousContainer === event.container) {
      // This handles sorting within the same container
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else if (event.previousContainer.id === 'sideContainer' && event.container.id === 'pageContainer') {
      // This handles transferring from side to page container
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    // Maintain the transform after drop
    if (event.item.data.transform) {
      event.item.element.nativeElement.style.transform = event.item.data.transform;
    }
  }

  onDragEnd(event: CdkDragEnd, item: ContainerItem) {
    const transform = `translate3d(${event.source.getFreeDragPosition().x}px, ${event.source.getFreeDragPosition().y}px, 0)`;
    item.transform = transform;  // Save the position to maintain it after drop
    event.source.element.nativeElement.style.transform = transform;
  }


  ngOnInit(): void {
    window.electron.ipcRenderer.on('container-data', (event, data) => {
      console.log('Received container data:', data);
    });
  }
}
