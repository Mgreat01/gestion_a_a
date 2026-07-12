import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WebSocketAlertMessage } from '../../../models/alert';
import { WebsocketService } from '../../../core/services/websocket.service';

@Injectable({ providedIn: 'root' })
export class RescuerWebsocketService {
  private readonly socket = inject(WebsocketService);
  readonly messages$: Observable<WebSocketAlertMessage> = this.socket.messages$;
  connect(): void { this.socket.connect('/alerts/ws/rescuer'); }
  disconnect(): void { this.socket.disconnect(); }
}
