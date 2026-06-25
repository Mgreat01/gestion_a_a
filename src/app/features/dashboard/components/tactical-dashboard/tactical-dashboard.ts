import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Alert,
  AlertSeverity,
  AlertStatus,
  CreateAlertPayload,
  UpdateAlertPayload
} from '../../../../models/alert';
import { AuthMeResponse } from '../../../../models/user';
import { MapView } from '../map-view/map-view';
import { DashboardSidebar, SidebarView } from '../dashboard-sidebar/dashboard-sidebar';

@Component({
  selector: 'app-tactical-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, MapView, DashboardSidebar],
  templateUrl: './tactical-dashboard.html'
})
export class TacticalDashboard {
  @Input() alerts: Alert[] = [];
  @Input() currentUser: AuthMeResponse | null = null;
  @Input() loading = false;
  @Input() error = '';

  @Output() refresh = new EventEmitter<void>();
  @Output() createAlert = new EventEmitter<CreateAlertPayload>();
  @Output() updateAlert = new EventEmitter<{ alertId: string; payload: UpdateAlertPayload }>();

  selectedAlert: Alert | null = null;
  activeView: SidebarView = 'dashboard';

  severityFilter: 'all' | AlertSeverity = 'all';
  statusFilter: 'all' | AlertStatus = 'all';
  search = '';
  showCreateModal = false;

  draft: CreateAlertPayload = {
    encrypted_content: '',
    encrypted_key: '',
    latitude: 0,
    longitude: 0,
    severity: 'high'
  };

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  get isUser(): boolean {
    return this.currentUser?.role === 'user';
  }

  get myAlerts(): Alert[] {
    return this.alerts.filter(a => a.user_id === this.currentUser?.id);
  }

  get visibleAlerts(): Alert[] {
    return this.isAdmin ? this.alerts : this.myAlerts;
  }

  get filteredAlerts(): Alert[] {
    return this.visibleAlerts.filter(a =>
      (this.severityFilter === 'all' || a.severity === this.severityFilter) &&
      (this.statusFilter === 'all' || a.status === this.statusFilter) &&
      (`${a.id} ${a.assigned_to ?? ''} ${a.location ?? ''}`)
        .toLowerCase()
        .includes(this.search.toLowerCase())
    );
  }

  get activeAlerts(): number {
    return this.visibleAlerts.filter(a => a.status === 'active').length;
  }

  get criticalAlerts(): number {
    return this.visibleAlerts.filter(a => a.severity === 'high').length;
  }

  get acknowledgedAlerts(): number {
    return this.visibleAlerts.filter(a => a.status === 'acknowledged').length;
  }

  get resolvedAlerts(): number {
    return this.visibleAlerts.filter(a => a.status === 'resolved').length;
  }

  get mediumAlerts(): number {
    return this.visibleAlerts.filter(a => a.severity === 'medium').length;
  }

  get lowAlerts(): number {
    return this.visibleAlerts.filter(a => a.severity === 'low').length;
  }

  severityClass(severity: AlertSeverity): string {
    switch (severity) {
      case 'high':
        return 'bg-rose-500/15 text-rose-200 border border-rose-400/30';
      case 'medium':
        return 'bg-amber-500/15 text-amber-200 border border-amber-400/30';
      case 'low':
        return 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30';
      default:
        return 'bg-white/10 text-white border border-white/10';
    }
  }

  openAlert(alert: Alert): void {
    this.selectedAlert = alert;
  }

  closeDrawer(): void {
    this.selectedAlert = null;
  }

  markStatus(alert: Alert, status: AlertStatus): void {
    this.updateAlert.emit({
      alertId: alert.id,
      payload: { status }
    });
  }

  submitCreate(): void {
    this.createAlert.emit({ ...this.draft });
    this.showCreateModal = false;

    this.draft = {
      encrypted_content: '',
      encrypted_key: '',
      latitude: 0,
      longitude: 0,
      severity: 'high'
    };
  }
}