import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-top-bar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopBarComponent {
  // You can add @Input properties later if you want to make the text/logo dynamic
  @Input() title: string = 'Default Title';
  @Input() logo: string = '/assets/logo.svg'; // Path to a dummy SVG for now
}
