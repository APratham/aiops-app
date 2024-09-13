// events.component.ts
import { Component, OnInit } from '@angular/core';

interface Event {
  name: string;
  severity: string;
  startTime: string;
  status: string;
}

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})
export class EventsComponent implements OnInit {
  activeSegment: string = 'open';
  events: Event[] = [
    { name: 'Server Down', severity: 'High', startTime: '13/09/2024 21:30 UTC', status: 'New' },
  ];
  closedEvents: Event[] = [
    { name: 'Network Outage', severity: 'High', startTime: '11/09/2024 08:30 UTC', status: 'Closed' },
    { name: 'Memory Leak', severity: 'Low', startTime: '10/09/2024 14:22 UTC', status: 'Closed' },
    { name: 'API Unavailable', severity: 'High', startTime: '09/09/2024 19:24 UTC', status: 'Closed' },
    { name: 'Connection Lost', severity: 'Medium', startTime: '07/09/2024 15:30 UTC', status: 'Closed' },
  ];

  onSegmentChange(segment: any) {
    this.activeSegment = segment.detail.value;
  }

  ngOnInit() {
    console.log("Events loaded");
  }

  changeStatus(event: Event, newStatus: string) {
    event.status = newStatus;
    if (newStatus === 'Closed') {
      this.closedEvents.push(event);
      this.events = this.events.filter(e => e !== event);
    } else if (newStatus === 'In Progress') {
      this.events = this.events.filter(e => e !== event);
    }
  }
}
