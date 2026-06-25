
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { Alert } from '../../../../models/alert';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-view.html'
})
export class MapView implements AfterViewInit, OnChanges {
  @Input() alerts: Alert[] = [];
  @Input() mode: 'admin' | 'user' = 'user';
  @Input() selectedAlertId: string | null = null;
  private map?: L.Map;
  private markers = L.layerGroup();

  ngAfterViewInit() {
    if (this.map) return;
    this.map = L.map('map', { zoomControl: true }).setView([-4.325, 15.322], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    this.markers.addTo(this.map);
    setTimeout(() => { this.map?.invalidateSize(); this.render(); }, 0);
  }

  ngOnChanges(_: SimpleChanges): void {
    if (this.map) setTimeout(() => { this.map?.invalidateSize(); this.render(); }, 0);
  }

  private render() {
    if (!this.map) return;
    this.markers.clearLayers();
    const pts: L.LatLngTuple[] = [];

    for (const alert of this.alerts ?? []) {
      const lat = Number(alert.latitude), lng = Number(alert.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
      pts.push([lat, lng]);

      const color = alert.severity === 'high' ? '#f43f5e' : alert.severity === 'medium' ? '#f59e0b' : '#10b981';
      L.circleMarker([lat, lng], {
        radius: this.selectedAlertId === alert.id ? 13 : 9,
        color, fillColor: color, fillOpacity: .9, weight: 2
      })
      .bindPopup(`<b>Alert #${alert.id.slice(0,8)}</b><br>${alert.status} • ${alert.severity}<br>${alert.location ?? `${lat}, ${lng}`}`)
      .addTo(this.markers);

      L.circle([lat, lng], {
        radius: this.selectedAlertId === alert.id ? 220 : 140,
        color, fillColor: color, fillOpacity: .08, weight: 1
      }).addTo(this.markers);
    }

    if (pts.length) this.map.fitBounds(L.latLngBounds(pts).pad(0.25));
    else this.map.setView([-4.325, 15.322], 12);
  }
}
