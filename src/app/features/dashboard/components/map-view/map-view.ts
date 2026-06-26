import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { Alert } from '../../../../models/alert';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-view.html',
  styleUrl: './map-view.css'
})
export class MapView implements AfterViewInit, OnChanges {
  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;

  @Input() alerts: Alert[] = [];
  @Input() mode: 'admin' | 'user' = 'user';
  @Input() selectedAlertId: string | null = null;

  private map?: L.Map;
  private markers = L.layerGroup();

  ngAfterViewInit(): void {
    if (this.map || !this.mapContainer) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([-4.325, 15.322], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.markers.addTo(this.map);
    setTimeout(() => {
      this.map?.invalidateSize();
      this.render();
    }, 0);
  }

  ngOnChanges(_: SimpleChanges): void {
    if (!this.map) return;

    setTimeout(() => {
      this.map?.invalidateSize();
      this.render();
    }, 0);
  }

  private render(): void {
    if (!this.map) return;

    this.markers.clearLayers();
    const points: L.LatLngTuple[] = [];

    for (const alert of this.alerts ?? []) {
      const lat = Number(alert.latitude);
      const lng = Number(alert.longitude);

      if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

      points.push([lat, lng]);

      const color = alert.severity === 'high' ? '#dc2626' : alert.severity === 'medium' ? '#d97706' : '#059669';
      const selected = this.selectedAlertId === alert.id;

      L.circleMarker([lat, lng], {
        radius: selected ? 13 : 9,
        color,
        fillColor: color,
        fillOpacity: 0.86,
        weight: selected ? 3 : 2
      })
        .bindPopup(`<b>Alerte #${alert.id.slice(0, 8)}</b><br>${alert.status} - ${alert.severity}<br>${alert.location ?? `${lat}, ${lng}`}`)
        .addTo(this.markers);

      L.circle([lat, lng], {
        radius: selected ? 220 : 140,
        color,
        fillColor: color,
        fillOpacity: 0.08,
        weight: 1
      }).addTo(this.markers);
    }

    if (points.length) {
      this.map.fitBounds(L.latLngBounds(points).pad(0.25));
      return;
    }

    this.map.setView([-4.325, 15.322], 12);
  }
}
