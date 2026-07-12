import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Alert, AlertStatus } from '../../../../models/alert';
import { RescuerStateService } from '../../store/rescuer-state.service';
import { LocationService } from '../../../../core/services/location.service';
import { MapView } from '../../../dashboard/components/map-view/map-view';

@Component({ selector: 'app-rescuer-dashboard', standalone: true, imports: [CommonModule, FormsModule, MapView], templateUrl: './rescuer-dashboard.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class RescuerDashboardComponent implements OnInit, OnDestroy {
  private readonly state = inject(RescuerStateService);
  private readonly location = inject(LocationService);
  readonly assignedAlerts = this.state.assignedAlerts;
  readonly nearbyAlerts = this.state.nearbyAlerts;
  readonly statistics = this.state.statistics;
  readonly loading = this.state.loading;
  readonly error = this.state.error;
  readonly statusFilter = signal<'all' | AlertStatus>('all');
  readonly selectedAlert = signal<Alert | null>(null);
  readonly visibleAlerts = computed(() => this.assignedAlerts().filter(alert => this.statusFilter() === 'all' || alert.status === this.statusFilter()));
  ngOnInit(): void { this.state.load(); this.state.connect(); void this.loadLocation(); }
  ngOnDestroy(): void { this.state.destroy(); }
  refresh(): void { this.state.load(); }
  actionFor(alert: Alert): { label: string; action: 'accept' | 'start' | 'resolve' } | null {
    if (alert.status === 'active') return { label: 'Accepter', action: 'accept' };
    if (alert.status === 'acknowledged') return { label: 'Démarrer intervention', action: 'start' };
    if (alert.status === 'assigned') return { label: 'Résoudre', action: 'resolve' };
    return null;
  }
  act(alert: Alert): void { const action = this.actionFor(alert); if (action) this.state.runAction(action.action, alert.id); }
  locationLabel(alert: Alert): string { return alert.address || `${alert.location?.coordinates?.[1] ?? alert.latitude}, ${alert.location?.coordinates?.[0] ?? alert.longitude}`; }
  elapsed(alert: Alert): string { const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(alert.created_at)) / 60000)); return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`; }
  private async loadLocation(): Promise<void> { try { const position = await this.location.getCurrentPosition(); this.state.loadNearby(position.latitude, position.longitude); } catch { /* Nearby alerts remain unavailable until location permission is granted. */ } }
}
