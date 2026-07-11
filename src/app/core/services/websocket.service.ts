import { Injectable, NgZone, inject } from '@angular/core';
import { Subject, timer } from 'rxjs';

import { WebSocketAlertMessage } from '../../models/alert';
import { Auth } from './auth';
import { environment } from '../../../environments/environments';
@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private readonly auth = inject(Auth);
  private readonly zone = inject(NgZone);
  private readonly reconnectDelayMs = 3000;
  private readonly messagesSubject = new Subject<WebSocketAlertMessage>();

  readonly messages$ = this.messagesSubject.asObservable();

  private socket?: WebSocket;
  private reconnectSubscription?: { unsubscribe: () => void };
  private manuallyClosed = false;

  connect(path = '/alerts/ws/admin'): void {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      return;
    }

    const token = this.auth.getToken();

    if (!token) {
      return;
    }

    this.manuallyClosed = false;
    const url = this.buildWebSocketUrl(path, token);
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectSubscription?.unsubscribe();
      this.reconnectSubscription = undefined;
    };

    socket.onmessage = (event) => {
      this.zone.run(() => {
        const parsed = this.parseMessage(event.data);

        if (parsed) {
          this.messagesSubject.next(parsed);
        }
      });
    };

    socket.onclose = () => {
      if (this.socket === socket) {
        this.socket = undefined;
      }

      if (!this.manuallyClosed) {
        this.scheduleReconnect(path);
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  disconnect(): void {
    this.manuallyClosed = true;
    this.reconnectSubscription?.unsubscribe();
    this.reconnectSubscription = undefined;
    this.socket?.close();
    this.socket = undefined;
  }

  private scheduleReconnect(path: string): void {
    this.reconnectSubscription?.unsubscribe();
    this.reconnectSubscription = timer(this.reconnectDelayMs).subscribe(() => this.connect(path));
  }

  private parseMessage(data: string): WebSocketAlertMessage | null {
    try {
      const parsed = JSON.parse(data) as WebSocketAlertMessage;

      if (parsed && typeof parsed === 'object' && typeof parsed.type === 'string') {
        return parsed;
      }
    } catch {
      return null;
    }

    return null;
  }

  private buildWebSocketUrl(path: string, token: string): string {

  const apiUrl = environment.apiUrl;

  const wsProtocol = apiUrl.startsWith('https')
    ? 'wss'
    : 'ws';


  const host = apiUrl
    .replace(/^https?:\/\//, '');


  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;


  return `${wsProtocol}://${host}${normalizedPath}?token=${encodeURIComponent(token)}`;
}
}
