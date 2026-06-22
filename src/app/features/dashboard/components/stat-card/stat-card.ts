import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css'
})
export class StatCard {

  @Input() title = '';
  @Input() value = '';
  @Input() color = 'red';

}