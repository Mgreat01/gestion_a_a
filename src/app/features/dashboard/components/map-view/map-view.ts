import {
  Component,
  Input,
  AfterViewInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import * as L from 'leaflet';

import { Alert } from '../../../../models/alert';

@Component({
  selector: 'app-map-view',
  standalone: true,
  templateUrl: './map-view.html',
  styleUrl: './map-view.css'
})
export class MapView
  implements AfterViewInit, OnChanges {

  @Input()
  alerts: Alert[] = [];

  map!: L.Map;

  markersLayer = L.layerGroup();

  ngAfterViewInit() {

    this.map = L.map('map').setView(
      [-4.325, 15.322],
      12
    );

    L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    ).addTo(this.map);

    this.markersLayer.addTo(this.map);

    this.renderMarkers();
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (
      changes['alerts'] &&
      this.map
    ) {
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
        <strong>${alert.severity}</strong>
        <br/>
        ${alert.status}
      `);

      marker.addTo(this.markersLayer);

    });

  }
}