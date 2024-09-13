import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-incidents',
  templateUrl: './incidents.component.html',
  styleUrls: ['./incidents.component.scss'],
})
export class IncidentsComponent  implements OnInit {
  activeSegment: string = 'open';
  
  onSegmentChange(segment: any) {
    this.activeSegment = segment.detail.value;
  }

  constructor() { }

  ngOnInit() {}

}
