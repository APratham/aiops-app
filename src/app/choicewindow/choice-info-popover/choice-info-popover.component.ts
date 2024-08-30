import { Component, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-choiceinfopopover',
  templateUrl: './choice-info-popover.component.html',
  styleUrls: ['./choice-info-popover.component.scss']
})

export class ChoiceInfoPopoverComponent {
  @Input() containerName!: string;
  @Input() containerStatus!: string;
  @Input() containerCreated!: string;
  @Input() containerInfo!: string;

  constructor(private popoverController: PopoverController) {}

  dismissPopover() {
    this.popoverController.dismiss();
  }
}
