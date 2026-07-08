import { Injectable, signal } from '@angular/core';

import { LocationPoint } from '../../models/alert';

@Injectable({ providedIn: 'root' })
export class LocationService {
  readonly currentPosition = signal<LocationPoint | null>(null);
  readonly error = signal('');

  private watchId: number | null = null;

  getCurrentPosition(): Promise<LocationPoint> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolocation is not supported by this browser.');
        this.error.set(error.message);
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = this.toLocationPoint(position);
          this.currentPosition.set(location);
          this.error.set('');
          resolve(location);
        },
        (error) => {
          this.error.set(error.message);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
      );
    });
  }

  watchPosition(): void {
    if (this.watchId !== null || !navigator.geolocation) {
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition.set(this.toLocationPoint(position));
        this.error.set('');
      },
      (error) => this.error.set(error.message),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 },
    );
  }

  stopWatching(): void {
    if (this.watchId === null || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
  }

  private toLocationPoint(position: GeolocationPosition): LocationPoint {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? 0,
    };
  }
}
