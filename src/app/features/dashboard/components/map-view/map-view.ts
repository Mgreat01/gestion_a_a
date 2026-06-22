import {
  Component,
  Input,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  OnDestroy
} from '@angular/core';

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

  ngAfterViewInit() {
    this.map = L.map('map', { zoomControl: false }).setView([-4.325, 15.322], 12);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    
    this.markersLayer.addTo(this.map);

    setTimeout(() => this.map.invalidateSize(), 0);
    
    // Rendu initial des marqueurs
    this.renderMarkers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['alerts'] && this.map) {
      this.renderMarkers();
    }
  }

  renderMarkers(): void {
    this.markersLayer.clearLayers();

    this.alerts.forEach(alert => {
      const marker = L.marker([
        alert.latitude,
        alert.longitude
      ]);

      marker.bindPopup(`
        <div class="text-sm font-bold">${alert.severity.toUpperCase()}</div>
        <div class="text-xs">${alert.status}</div>
      `);

      marker.addTo(this.markersLayer);
    });
  }

  // Pattern .autoDispose pour éviter les fuites mémoire
  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}