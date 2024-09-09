import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { ContainerItem } from './container.model'; // Replace './container-item' with the correct path to the 'ContainerItem' type

@Injectable({
  providedIn: 'root'
})
export class CardserviceService {
  private containerDataSource = new BehaviorSubject<ContainerItem[]>([]);
  currentContainers = this.containerDataSource.asObservable();

  constructor() { }

  updateContainerData(data: any[], defaultSize: 'square' | 'rectangle' | 'large-square' = 'large-square') {
    const containerItems: ContainerItem[] = data.map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      content: `${d.name} (${d.type})`,
      size: defaultSize, // This can be set dynamically as needed
      isDragging: false,
      disabled: false
    }));
    this.containerDataSource.next(containerItems);
  }
}