import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentItem } from '../incident-item/incident-item';
import { Alert } from '../../../../models/alert';

@Component({
  selector: 'app-incident-feed',
  standalone: true,
  imports: [
    CommonModule,
    IncidentItem
  ],
  templateUrl: './incident-feed.html',
  styleUrl: './incident-feed.css'
})
export class IncidentFeed {

  @Input()
  alerts: Alert[] = [];

}