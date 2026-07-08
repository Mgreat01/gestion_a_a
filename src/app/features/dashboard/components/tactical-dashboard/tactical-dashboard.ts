import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  AdminAlertNotification,
  Alert,
  AlertSeverity,
  AlertStatus,
  CreateEncryptedAlertRequest,
  DashboardStatistics,
  UpdateAlertPayload,
} from '../../../../models/alert';
import { AuthMeResponse } from '../../../../models/user';
import { MapView } from '../map-view/map-view';
import { DashboardSidebar, SidebarView } from '../dashboard-sidebar/dashboard-sidebar';
import { Auth } from '../../../../core/services/auth';
import { LocationService } from '../../../../core/services/location.service';

@Component({
  selector: 'app-tactical-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, MapView, DashboardSidebar],
  templateUrl: './tactical-dashboard.html',
})
export class TacticalDashboard implements OnInit {
  ngOnInit(): void {
    void this.prepareDraftLocation();
  }
  @Input() alerts: Alert[] = [];
  @Input() currentUser: AuthMeResponse | null = null;
  @Input() loading = false;
  @Input() error = '';
  @Input() adminNotifications: AdminAlertNotification[] = [];
  @Input() statistics: DashboardStatistics | null = null;

  @Output() refresh = new EventEmitter<void>();
  @Output() createAlert = new EventEmitter<CreateEncryptedAlertRequest>();
  @Output() updateAlert = new EventEmitter<{ alertId: string; payload: UpdateAlertPayload }>();
  @Output() clearNotifications = new EventEmitter<void>();
  private locationService = inject(LocationService);
  private authService = inject(Auth);
  private router = inject(Router);
  coords: { latitude: number; longitude: number } | null = null;

  selectedAlert: Alert | null = null;
  activeView: SidebarView = 'dashboard';

  severityFilter: 'all' | AlertSeverity = 'all';
  statusFilter: 'all' | AlertStatus = 'all';
  search = '';
  showCreateModal = false;
  locating = false;

  draft: CreateEncryptedAlertRequest = {
    message: '',
    severity: 'high',
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
          { key: 'settings', label: 'Paramètres' },
        ]
      : [
          { key: 'dashboard', label: 'Accueil' },
          { key: 'alerts', label: 'Mes alertes' },
          { key: 'map', label: 'Carte' },
          { key: 'profile', label: 'Profil' },
          { key: 'settings', label: 'Paramètres' },
        ];
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  get isUser(): boolean {
    return this.currentUser?.role === 'user';
  }

  get myAlerts(): Alert[] {
    return this.alerts.filter((a) => a.user_id === this.currentUser?.id);
  }

  get visibleAlerts(): Alert[] {
    return this.isAdmin ? this.alerts : this.myAlerts;
  }

  get filteredAlerts(): Alert[] {
    return this.visibleAlerts.filter(
      (a) =>
        (this.severityFilter === 'all' || a.severity === this.severityFilter) &&
        (this.statusFilter === 'all' || a.status === this.statusFilter) &&
        `${a.id} ${a.assigned_to ?? ''} ${a.address ?? ''} ${this.locationLabel(a)}`
          .toLowerCase()
          .includes(this.search.toLowerCase()),
    );
  }

  get activeAlerts(): number {
    return this.visibleAlerts.filter((a) => a.status === 'active').length;
  }

  get criticalAlerts(): number {
    return this.visibleAlerts.filter((a) => a.severity === 'high').length;
  }

  get acknowledgedAlerts(): number {
    return this.visibleAlerts.filter((a) => a.status === 'acknowledged').length;
  }

  get resolvedAlerts(): number {
    return this.visibleAlerts.filter((a) => a.status === 'resolved').length;
  }

  get mediumAlerts(): number {
    return this.visibleAlerts.filter((a) => a.severity === 'medium').length;
  }

  get lowAlerts(): number {
    return this.visibleAlerts.filter((a) => a.severity === 'low').length;
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

  notificationLabel(notification: AdminAlertNotification): string {
    if (typeof notification.message === 'string' && notification.message.trim() !== '') {
      return notification.message;
    }

    const alertId = notification.alert_id ?? notification.id;

    if (typeof alertId === 'string' && alertId.trim() !== '') {
      return `Nouvelle alerte #${alertId.slice(0, 8)}`;
    }

    return 'Nouvelle notification admin';
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
      payload: { status },
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    void this.prepareDraftLocation();
  }

  async submitCreate(): Promise<void> {
    const coords = await this.prepareDraftLocation();

    if (!coords) {
      return;
    }

    const payload: CreateEncryptedAlertRequest = {
      ...this.draft,
      message: this.draft.message.trim(),
    };

    if (!payload.message) {
      this.error = 'Le message est requis.';
      return;
    }

    this.createAlert.emit(payload);
    this.showCreateModal = false;

    this.draft = {
      message: '',
      severity: 'high',
    };
  }

  locationLabel(alert: Alert): string {
    if (alert.address != null && alert.address.trim() !== '') {
      return alert.address;
    }

    const latitude = alert.location?.coordinates?.[1] ?? alert.latitude;
    const longitude = alert.location?.coordinates?.[0] ?? alert.longitude;

    return `${latitude}, ${longitude}`;
  }

  private async prepareDraftLocation(): Promise<
    { latitude: number; longitude: number } | undefined
  > {
    const coords = await this.loadLocalisation();

    if (!coords) {
      return undefined;
    }

    return coords;
  }

  loadLocalisation(): Promise<{ latitude: number; longitude: number } | undefined> {
    this.locating = true;

    return this.locationService
      .getCurrentPosition()
      .then((pos) => {
        this.coords = {
          latitude: pos.latitude,
          longitude: pos.longitude,
        };
        console.log('Current position:', this.coords);
        return this.coords;
      })
      .catch((err) => {
        this.error = String(err);
        return undefined;
      })
      .finally(() => {
        this.locating = false;
      });
  }

  deconnexion(): void {
    this.authService.removeToken();
    this.router.navigate(['/login']);
  }
}
