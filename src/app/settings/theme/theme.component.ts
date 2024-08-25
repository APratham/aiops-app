import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html',
  styleUrls: ['./theme.component.scss']
})
export class ThemeComponent implements OnInit {

  settings = {
    theme: 'light'
  };

  constructor() { }

  ngOnInit(): void {
    // Load settings if needed
  }

  saveSettings() {
    // Save settings to storage or database
  }
}
