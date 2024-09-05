import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, CdkDragEnd, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface ContainerItem {
  content: string;
  size: 'square' | 'rectangle' | 'large-rectangle';  // Added size property
  transform?: string;  // To store the drag position
  isDragging?: boolean;  // To track dragging state
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  containerData: any;

  sideContainerItems: ContainerItem[] = [
    { content: 'Item 1', size: 'square', isDragging: false },
    { content: 'Item 2', size: 'rectangle', isDragging: false },
  ];

  pageContainerItems: ContainerItem[] = [
    { content: 'Page Item 1', size: 'square' },
    { content: 'Page Item 2', size: 'large-rectangle' },
  ];

  sideContainerVisible = true;

  toggleSideContainer(): void {
    this.sideContainerVisible = !this.sideContainerVisible;
  }


  // Dynamically set the item's class based on its size
  getItemClass(item: ContainerItem): string {
    return `example-box ${item.size}`;
  }
  
  getPreviewClass(item: ContainerItem): string {
    return `custom-preview preview-${item.size}`;
  }

  onDrop(event: CdkDragDrop<any[]>) {
    let draggedItem = event.item.data;
  
    // Move the item within the same container
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } 
    // Transfer item between containers
    else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
  
      // After the transfer, reassign the dragged item since its reference may have changed
      draggedItem = event.container.data[event.currentIndex];
    }
  
    // Safely apply the transform after verifying the item data
    if (draggedItem?.transform) {
      event.item.element.nativeElement.style.transform = draggedItem.transform;
    } else {
      console.warn('Dropped item data or transform is undefined.');
    }
  }
  
  onDragStart(event: any, item: any): void {
    item.isDragging = true;
    console.log('Drag started:', item);
  }

  onDragEnd(event: CdkDragEnd, item: ContainerItem) {
    const position = event.source.getFreeDragPosition();
    const transformValue = `translate3d(${position.x}px, ${position.y}px, 0)`;
  
    // Ensure item has transform property
    item.transform = transformValue;
  
    // Set the transform in the DOM element
    event.source.element.nativeElement.style.transform = transformValue;
    console.log('Drag ended:', item);
  }

  ngOnInit(): void {
    window.electron.ipcRenderer.on('container-data', (event, data) => {
      console.log('Received container data:', data);
    });
  }
}
