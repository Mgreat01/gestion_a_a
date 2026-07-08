import { Injectable } from '@angular/core';

import { Alert, DashboardStatistics } from '../../models/alert';

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  calculate(alerts: Alert[]): DashboardStatistics {
    const resolvedAlerts = alerts.filter((alert) => alert.status === 'resolved');

    return {
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter((alert) => alert.status === 'active').length,
      criticalAlerts: alerts.filter((alert) => alert.severity === 'high').length,
      acknowledgedAlerts: alerts.filter((alert) => alert.status === 'acknowledged').length,
      resolvedAlerts: resolvedAlerts.length,
      mediumAlerts: alerts.filter((alert) => alert.severity === 'medium').length,
      lowAlerts: alerts.filter((alert) => alert.severity === 'low').length,
      averageInterventionMinutes: this.averageInterventionMinutes(resolvedAlerts),
    };
  }

  private averageInterventionMinutes(alerts: Alert[]): number {
    const durations = alerts
      .map((alert) => {
        if (!alert.created_at || !alert.resolved_at) {
          return null;
        }

        const created = Date.parse(alert.created_at);
        const resolved = Date.parse(alert.resolved_at);

        if (Number.isNaN(created) || Number.isNaN(resolved) || resolved < created) {
          return null;
        }

        return Math.round((resolved - created) / 60000);
      })
      .filter((duration): duration is number => duration !== null);

    if (durations.length === 0) {
      return 0;
    }

    return Math.round(durations.reduce((total, duration) => total + duration, 0) / durations.length);
  }
}
