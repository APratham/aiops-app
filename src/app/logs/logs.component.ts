import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
})
export class LogsComponent  implements OnInit {
  activeSegment: string = 'all';
  logs: { message: string; resultCount: string; }[] = [];
  inputFilter: string | RegExp = '';
  filteredLogs!: { message: string; resultCount: string; }[];

  onSegmentChange(segment: any) {
    this.activeSegment = segment.detail.value;
  }

  onFilterLogs() {
    try {
      const regex = new RegExp(this.inputFilter, 'i');  // Create regex from user input, case-insensitive
      this.filteredLogs = this.logs.filter(log => regex.test(log.message));
    } catch (e) {
      console.error('Invalid regex pattern:', e);
      this.filteredLogs = [...this.logs];  // If regex is invalid, show all logs
    }
  }

  constructor() { }

  ngOnInit() {
    this.logs = [
      { message: 'Log message', resultCount: '10,000' },
      { message: 'Log message', resultCount: '10,000' },
      { message: 'Log message', resultCount: '10,000' },
      { message: 'Log message', resultCount: '10,000' },
      { message: 'Log message', resultCount: '10,000' },
      { message: 'Log message', resultCount: '10,000' },
    ];
    this.filteredLogs = [...this.logs];
  }

}
