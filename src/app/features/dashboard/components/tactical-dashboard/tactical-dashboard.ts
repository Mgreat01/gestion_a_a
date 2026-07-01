import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
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
import { Dashboard } from '../../../../core/dashboard';

@Component({
  selector: 'app-tactical-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, MapView, DashboardSidebar],
  templateUrl: './tactical-dashboard.html'
})
export class TacticalDashboard implements OnInit {
  ngOnInit(): void {
    this.loadLocalisation();
    this.reverseGeocode(this.coords?.latitude ?? 0, this.coords?.longitude ?? 0);
  }
  @Input() alerts: Alert[] = [];
  @Input() currentUser: AuthMeResponse | null = null;
  @Input() loading = false;
  @Input() error = '';

  @Output() refresh = new EventEmitter<void>();
  @Output() createAlert = new EventEmitter<CreateAlertPayload>();
  @Output() updateAlert = new EventEmitter<{ alertId: string; payload: UpdateAlertPayload }>();
  private openApiUrl =  '/nominatim/reverse';
  private dashboardService = inject(Dashboard);
  coords: { latitude: number; longitude: number } | null = null;

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
type: any;

  get sidebarItems(): { key: SidebarView; label: string }[] {
    return this.isAdmin
      ? [
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'alerts', label: 'Alertes' },
          { key: 'map', label: 'Carte' },
          { key: 'analytics', label: 'Analytics' },
          { key: 'profile', label: 'Profil' },
          { key: 'settings', label: 'Paramètres' }
        ]
      : [
          { key: 'dashboard', label: 'Accueil' },
          { key: 'alerts', label: 'Mes alertes' },
          { key: 'map', label: 'Carte' },
          { key: 'profile', label: 'Profil' },
          { key: 'settings', label: 'Paramètres' }
        ];
  }

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
        return 'bg-red-50 text-red-800 border border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-800 border border-amber-200';
      case 'low':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
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

    this.loadLocalisation().then(() => {
      this.draft = {
      encrypted_content: '',
      encrypted_key: '',
      latitude: this.coords?.latitude,
      longitude: this.coords?.longitude,
      severity: 'high'
    };
    console.log('Draft alert:', this.draft);
    });
  }

  reverseGeocode(lat: number, lon: number): Promise<any> {
    const url = `${this.openApiUrl}?lat=${lat}&lon=${lon}&format=json`;
    return fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        return data;
      })
      .catch(error => {
        console.error('Error during reverse geocoding:', error);
        return null;
      });
  }

  loadLocalisation(): Promise<{ latitude: number; longitude: number } | undefined> {
    return this.dashboardService.getCurrentPosition()
      .then((pos) => {
        this.coords = {
          latitude: pos.latitude,
          longitude: pos.longitude
        };
        console.log('Current position:', this.coords);
        return this.coords;
      })
      .catch((err) => {
        this.error = String(err);
        return undefined;
      });
  }

}
