import { Component, Input, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { Alert } from '../../../../models/alert';

@Component({
  selector: 'app-map-view',
  standalone: true,
  templateUrl: './map-view.html',
  styleUrl: './map-view.css'
})
export class MapView implements AfterViewInit, OnChanges, OnDestroy {
  @Input() alerts: Alert[] = [];
  map!: L.Map;
  markersLayer = L.layerGroup();
  ringsLayer = L.layerGroup();
  readonly hqCoords: L.LatLngExpression = [-4.325, 15.322];

  ngAfterViewInit() {
    this.map = L.map('map', { zoomControl: false, attributionControl: false }).setView(this.hqCoords, 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 20 }).addTo(this.map);
    this.markersLayer.addTo(this.map);
    this.ringsLayer.addTo(this.map);
    this.addHQMarker();
    setTimeout(() => this.map.invalidateSize(), 0);
    this.renderMarkers();
  }
  ngOnChanges(changes: SimpleChanges): void { if (changes['alerts'] && this.map) this.renderMarkers(); }
  addHQMarker() {
    const icon = L.divIcon({ className: '', html: '<div class="hq-pulse"></div><div class="hq-marker"></div><div class="hq-label">HQ-ALPHA</div>', iconSize: [120,60], iconAnchor:[18,18]});
    L.marker(this.hqCoords, { icon }).addTo(this.map);
  }
  renderMarkers(): void {
    this.markersLayer.clearLayers(); this.ringsLayer.clearLayers();
    this.alerts.forEach(alert => {
      const cls = `alert-dot alert-${alert.severity}`;
      const icon = L.divIcon({ className: '', html: `<div class="${cls}"></div>`, iconSize:[16,16], iconAnchor:[8,8]});
      L.marker([alert.latitude, alert.longitude], { icon }).bindPopup(`<div style="min-width:150px"><div style="font-weight:700">${alert.severity.toUpperCase()} ALERT</div><div style="font-size:12px;opacity:.8">${alert.status}</div></div>`).addTo(this.markersLayer);
      L.circle([alert.latitude, alert.longitude], { radius: alert.severity === 'high' ? 850 : alert.severity === 'medium' ? 550 : 350, color: alert.severity === 'high' ? '#ef4444' : alert.severity === 'medium' ? '#f59e0b' : '#10b981', weight: 1, opacity: .45, fillOpacity: .05 }).addTo(this.ringsLayer);
    });
  }
  ngOnDestroy() { if (this.map) this.map.remove(); }
}
