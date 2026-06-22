
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
  private map!: L.Map;
  private markers: L.LayerGroup = L.layerGroup();

  ngAfterViewInit() {
    this.map = L.map('map', { zoomControl: false }).setView([-4.325, 15.322], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(this.map);
    this.markers.addTo(this.map);
    this.render();
  }
  ngOnChanges(changes: SimpleChanges): void { if (this.map) this.render(); }

  render() {
    this.markers.clearLayers();
    const hq = L.circleMarker([-4.325, 15.322], { radius: 12, color: '#fb7185', fillColor: '#fb7185', fillOpacity: .9 }).bindPopup('HQ-ALPHA');
    hq.addTo(this.markers);
    this.alerts.forEach(alert => {
      const color = alert.severity === 'high' ? '#f43f5e' : alert.severity === 'medium' ? '#f59e0b' : '#10b981';
      const marker = L.circleMarker([alert.latitude, alert.longitude], { radius: this.selectedAlertId===alert.id ? 14 : 9, color, fillColor: color, fillOpacity: .85, weight: 2 })
        .bindPopup(`<b>${alert.id}</b><br/>${alert.status} • ${alert.severity}`);
      marker.addTo(this.markers);
    });
  }
}
