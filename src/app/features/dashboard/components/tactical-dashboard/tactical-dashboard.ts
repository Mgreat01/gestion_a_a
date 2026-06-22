import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Alert } from '../../../../models/alert';
import { MapView } from '../map-view/map-view';
import { DashboardSidebar } from '../dashboard-sidebar/dashboard-sidebar';

@Component({
  selector: 'app-tactical-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, MapView, DashboardSidebar],
  templateUrl: './tactical-dashboard.html'
})
export class TacticalDashboard {
  @Input() alerts: Alert[] = [];
  mobileNavOpen = false;

  get activeAlerts(): number {
    return this.alerts.filter(a => a.status === 'active').length;
  }
  get criticalAlerts(): number {
    return this.alerts.filter(a => a.severity === 'high').length;
  }
  get deployedUnits(): number {
    return Math.max(12, this.alerts.length * 3);
  }
  get netLoad(): number {
    return Math.min(92, 18 + this.alerts.length * 6);
  }
  severityLabel(severity: Alert['severity']): string {
    return severity === 'high' ? 'Critical' : severity === 'medium' ? 'Elevated' : 'Low';
  }
  alertTitle(alert: Alert): string {
    const area = alert.location?.coordinates?.length ? `Sector ${Math.abs(Math.round(alert.location.coordinates[0]))}` : `Incident ${alert.id}`;
    return `${area}: ${this.severityLabel(alert.severity)} Alert`;
  }
  toggleMobileNav(){ this.mobileNavOpen = !this.mobileNavOpen; }
}
