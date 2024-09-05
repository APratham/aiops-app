/**
 * Parts of this code adapted from Angular Material CDK Documentation
 * 
 * The MIT License
 *
 * Copyright (c) 2024 Google LLC.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, CdkDragEnd, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface ContainerItem {
  content: string;
  size: 'square' | 'rectangle' | 'large-rectangle';  
  transform?: string;  
  isDragging?: boolean;  // To track dragging state
  disabled?: boolean; // To track draggable state
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  containerData: any;


  sideContainerItems: ContainerItem[] = [
    { content: 'Item 1', size: 'square', isDragging: false, disabled: false },
    { content: 'Item 2', size: 'rectangle', isDragging: false, disabled: false },
  ];

  pageContainerItems: ContainerItem[] = [
    { content: 'Page Item 1', size: 'square', isDragging: false, disabled: true },
    { content: 'Page Item 2', size: 'large-rectangle', isDragging: false, disabled: false },
  ];

  sideContainerVisible = true;

  toggleSideContainer(): void {
    this.sideContainerVisible = !this.sideContainerVisible;
  }


  getItemClass(item: ContainerItem): string {
    return `example-box ${item.size}`;
  }

/**   getSideItemClass(item: ContainerItem): string {
    return `side-item ${item.size}`;
  } */
  
/**   getPreviewClass(item: ContainerItem): string {
    return `custom-preview preview-${item.size}`;
  } */

  onDrop(event: CdkDragDrop<any[]>) {
    let draggedItem = event.item.data;
  
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } 
    else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
  
      draggedItem = event.container.data[event.currentIndex];
    }
  
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
  
    item.transform = transformValue;
  
    event.source.element.nativeElement.style.transform = transformValue;
    console.log('Drag ended:', item);
  }

  ngOnInit(): void {
    window.electron.ipcRenderer.on('container-data', (event, data) => {
      console.log('Received container data:', data);
    });
    
  }
}
