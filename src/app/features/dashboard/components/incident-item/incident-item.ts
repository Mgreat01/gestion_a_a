import { Component, Input } from '@angular/core';
import { Alert } from '../../../../models/alert';
import { dateTimestampProvider } from 'rxjs/internal/scheduler/dateTimestampProvider';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-incident-item',
  standalone: true,
  imports: [ DatePipe],
  templateUrl: './incident-item.html',
  styleUrl: './incident-item.css'
})
export class IncidentItem {

  @Input({required:true})
  alert!: Alert;

}