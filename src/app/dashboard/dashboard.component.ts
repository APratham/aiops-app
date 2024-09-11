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

import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CdkDragDrop, CdkDragEnd, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ContainerItem } from '../container.model'


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None // Apply this line
})

export class DashboardComponent implements OnInit {

  containerData: any;
  title = 'system-monitor-1'; 
  editMode = false; 
  currentTab = 'overview';
  activeMenuItem: string = 'overview';
  isDragging: boolean = false;


  @ViewChild('pageList1') pageList1!: CdkDropList;
  @ViewChild('pageList2') pageList2!: CdkDropList;

  sideContainerItems: ContainerItem[] = [
    { content: 'Item 1', size: 'square', isDragging: false, disabled: false },
    { content: 'Item 2', size: 'rectangle', isDragging: false, disabled: false },
  ];

  pageContainerItems1: ContainerItem[] = [
    { content: 'Docker Info Card', size: 'large-square', isDragging: false, disabled: true, type: 'Docker', cardType: 'info-card', image: '/src/app/assets/docker-logo.png' }, //Docker card
    { content: 'Downtime Card', size: 'large-rectangle', isDragging: false, disabled: false, type: 'Docker', cardType: 'downtime-card' },
    { content: 'Incidents Card', size: 'large-rectangle', isDragging: false, disabled: false, type: 'Docker', cardType: 'incident-card' },
    { content: 'Uptime Card', size: 'long-rectangle', isDragging: false, disabled: false, type: 'Docker', cardType: 'uptime' },
  ];
  
  pageContainerItems2: ContainerItem[] = [
    { content: 'CPU Anomaly', size: 'rectangle', isDragging: false, disabled: false, type: 'Docker', cardType: 'graph-rectangle' },
    { content: 'Memory Anomaly', size: 'rectangle', isDragging: false, disabled: false, type: 'Docker', cardType: 'graph-rectangle' },
  ];

  downtimeData = {
    downtime: "0%",
    change: "0%"
  };
  
  sideContainerVisible = true;

  ngAfterViewInit() {
    this.pageList1.data = this.pageContainerItems1;
    this.pageList2.data = this.pageContainerItems2;
  }

  toggleSideContainer(): void {
    this.sideContainerVisible = !this.sideContainerVisible;
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
  
    if (this.editMode) {
      setTimeout(() => {
        const inputElement = document.querySelector('.title-input') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus({preventScroll: true});  // Prevents scrolling on focus
        }
      }, 100);
    }
  }
  
  

  getItemClass(item: ContainerItem): string {
    let classes = `example-box ${item.size}`; 
    if (item.type) {
      classes += ` ${item.type.toLowerCase()}`; 
    }
    if (item.cardType) {
      classes += ` ${item.cardType.toLowerCase()}`; 
    }
    return classes;
  }
  

  selectTab(tabName: string): void {
    this.currentTab = tabName;
    this.activeMenuItem = tabName; // Set active menu item
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
    this.isDragging = true;
    console.log('Drag started:', item);
  }

  onDragEnd(event: CdkDragEnd, item: ContainerItem) {
    const position = event.source.getFreeDragPosition();
    const transformValue = `translate3d(${position.x}px, ${position.y}px, 0)`;
    this.isDragging = false;
    item.transform = transformValue;
  
    event.source.element.nativeElement.style.transform = transformValue;
    console.log('Drag ended:', item);
  }

  updateContainerCard(data: any): void {
    // Assuming data contains the required fields.
    this.pageContainerItems1[0].content = `Object ID: ${data.id} <br> Name: ${data.name} <br> Type: ${data.type} <img  src="../assets/docker-logo.png">`;
    this.pageContainerItems1[1].content = `<h3>Downtime</h3>
    <p class="downtime-value">0%</p>
    <p class="downtime-change">&#8681; 0</p>
    <p class="recovery-time">Avg Recovery: <span class="recovery-time-value">23m</span></p>
    <div class="recent-downtimes">
    <p>Recent Downtimes:</p>
      <ul>
        <li>2024-09-11T08:30:00Z</li>
        <li>2024-09-10T14:22:00Z</li>
        <li>2024-09-09T19:45:00Z</li>
      </ul>
    </div>`;
    this.pageContainerItems1[2].content = `<h3>Incidents</h3>
    <p class="incident-value">0</p>
    <p class="incident-change">&#9888; 0</p>
    <div class="incidents-status">
   
      <span class="open-incidents">5 open</span>
         <br>
      <span class="closed-incidents">15 closed </span>
    </div>
    <div class="recent-incidents">
    <p>Recent Incidents:</p>
      <ul>
        <li>Network outage - 2024-09-11</li>
        <li>System slowdown - 2024-09-10</li>
        <li>API failure - 2024-09-09</li>
      </ul>
    </div>
    `;
    this.pageContainerItems1[3].content = `<h3>Uptime</h3>
    <div class="progress-container">
        <div class="progress-bar"></div>
        25d 0h 0m
    </div>
    `;
  }

  ngOnInit(): void {
    window.electron.ipcRenderer.on('container-data', (event, data) => {
      console.log('Received container data:', data);
      this.updateContainerCard(data);  // Add this line
      this.pageContainerItems1[0].disabled = false;
      this.pageContainerItems1[0].type = 'Docker';
      console.log('Updated container card with data:', this.pageContainerItems1[0].content);
    });
  }
}
