import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { Alert } from '../../../../models/alert';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-view.html',
  styleUrl: './map-view.css'
})
export class MapView implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;

  @Input() alerts: Alert[] = [];
  @Input() mode: 'admin' | 'user' | 'rescuer' = 'user';
  @Input() selectedAlertId: string | null = null;

  private map?: L.Map;
  private markers = L.layerGroup();
  private userPosition: L.LatLngTuple | null = null;
  private userAccuracy = 0;
  private watchId: number | null = null;

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

  ngOnDestroy(): void {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    this.map?.remove();
  }

  private render(): void {
    if (!this.map) return;

    this.markers.clearLayers();

    if (this.mode === 'user') {
      this.renderUserLocation();
      return;
    }

    this.renderAlertLocations();
  }

  private renderUserLocation(): void {
    if (!this.map) return;

    if (!navigator.geolocation) {
      this.map.setView([-4.325, 15.322], 13);
      return;
    }

    if (!this.userPosition) {
      this.map.setView([-4.325, 15.322], 13);
      this.startUserLocationWatch();
      return;
    }

    const userIcon = L.divIcon({
      className: 'user-location-icon',
      html: '<span class="user-location-icon__pulse"></span><span class="user-location-icon__dot"></span>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    L.marker(this.userPosition, { icon: userIcon })
      .bindPopup('Votre position actuelle')
      .addTo(this.markers);

    if (this.userAccuracy > 0) {
      L.circle(this.userPosition, {
        radius: this.userAccuracy,
        color: '#0f766e',
        fillColor: '#0f766e',
        fillOpacity: 0.08,
        weight: 1
      }).addTo(this.markers);
    }

    this.map.setView(this.userPosition, 15);
    this.startUserLocationWatch();
  }

  private renderAlertLocations(): void {
    if (!this.map) return;

    const points: L.LatLngTuple[] = [];

    for (const alert of this.alerts ?? []) {
      const position = this.getAlertPosition(alert);

      if (!position) continue;

      const [lat, lng] = position;

      points.push(position);

      const color = alert.severity === 'high' ? '#dc2626' : alert.severity === 'medium' ? '#d97706' : '#059669';
      const selected = this.selectedAlertId === alert.id;

      L.circleMarker([lat, lng], {
        radius: selected ? 13 : 9,
        color,
        fillColor: color,
        fillOpacity: 0.86,
        weight: selected ? 3 : 2
      })
        .bindPopup(`<b>Alerte #${alert.id.slice(0, 8)}</b><br>${alert.status} - ${alert.severity}<br>${this.escapeHtml(this.locationLabel(alert, lat, lng))}`)
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

  private startUserLocationWatch(): void {
    if (this.watchId !== null || !navigator.geolocation) return;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.userPosition = [
          position.coords.latitude,
          position.coords.longitude
        ];
        this.userAccuracy = position.coords.accuracy ?? 0;
        this.render();
      },
      () => {
        this.userPosition = null;
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 12000
      }
    );
  }

  private getAlertPosition(alert: Alert): L.LatLngTuple | null {
    const lat = Number(alert.latitude ?? alert.location?.coordinates?.[1]);
    const lng = Number(alert.longitude ?? alert.location?.coordinates?.[0]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    if (lat === 0 && lng === 0) {
      return null;
    }

    return [lat, lng];
  }

  private locationLabel(alert: Alert, lat: number, lng: number): string {
    if (alert.address != null && alert.address.trim() !== '') {
      return alert.address;
    }

    return `${lat}, ${lng}`;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
