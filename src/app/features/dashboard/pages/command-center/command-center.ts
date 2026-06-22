import { Component, OnInit } from '@angular/core';

import { TacticalDashboard } from '../../components/tactical-dashboard/tactical-dashboard';

import { Alert } from '../../../../models/alert';
import { Dashboard } from '../../../../core/dashboard';
import { interval } from 'rxjs';

@Component({
  selector: 'app-command-center',
  standalone: true,
  imports: [TacticalDashboard],
  templateUrl: './command-center.html',
  styleUrl: './command-center.css'
})
export class CommandCenter implements OnInit {

  alerts: Alert[] = [];

  constructor(
    private dashboardService: Dashboard
  ) {}

  ngOnInit(): void {

  this.loadAlerts();

  interval(10000).subscribe(() => {

    this.loadAlerts();

  });

}

  loadAlerts(): void {

    this.dashboardService.getAlerts().subscribe({

      next: (alerts) => {

        this.alerts = alerts;

        console.log('ALERTS', alerts);

      },

      error: (error) => {

        console.error(error);

      }

    });

  }
}