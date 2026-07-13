import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Subscription, catchError } from 'rxjs';

import {
  AdminAlertNotification,
  Alert,
  CreateAlertPayload,
  CreateEncryptedAlertRequest,
  DashboardStatistics,
  UpdateAlertPayload,
  normalizeCreateAlertPayload,
} from '../../models/alert';

import { Dashboard } from './dashboard';
import { CryptoService } from './crypto.service';
import { KeyStorageService } from './key-storage.service';
import { LocationService } from './location.service';
import { StatisticsService } from './statistics.service';
import { WebsocketService } from './websocket.service';
import { Auth } from './auth';



@Injectable({
  providedIn: 'root'
})
export class AlertStateService {


  private readonly dashboard = inject(Dashboard);

  private readonly crypto = inject(CryptoService);

  private readonly keyStorage = inject(KeyStorageService);

  private readonly location = inject(LocationService);

  private readonly statisticsService = inject(StatisticsService);

  private readonly websocket = inject(WebsocketService);

  private readonly auth = inject(Auth);



  private readonly notificationsLimit = 20;



  readonly alerts = signal<Alert[]>([]);

  readonly notifications = signal<AdminAlertNotification[]>([]);

  readonly loading = signal(false);

  readonly error = signal('');



  readonly statistics = computed<DashboardStatistics>(() =>
    this.statisticsService.calculate(this.alerts())
  );



  private websocketSubscription?: Subscription;



  // ==============================
  // REALTIME
  // ==============================


  initializeRealtime(isAdmin:boolean):void{


    this.loadAlerts();


    this.websocketSubscription?.unsubscribe();



    if(!isAdmin){

      this.websocket.disconnect();

      return;

    }



    this.websocketSubscription =
      this.websocket.messages$
      .subscribe(message =>
        this.handleSocketMessage(message)
      );



    this.websocket.connect('/alerts/ws/admin');

  }





  destroyRealtime():void{

    this.websocketSubscription?.unsubscribe();

    this.websocketSubscription = undefined;

    this.websocket.disconnect();

  }





  // ==============================
  // LOAD ALERTS
  // ==============================


  loadAlerts():void{


    this.loading.set(true);



    this.dashboard
    .getAlerts()

    .pipe(

      catchError(err=>{

        this.error.set(
          err?.error?.detail ??
          'Erreur de chargement des alertes'
        );


        this.loading.set(false);


        return EMPTY;

      })

    )

    .subscribe(alerts=>{


      this.alerts.set(
        this.uniqueLatestAlerts(alerts)
      );


      this.error.set('');

      this.loading.set(false);


    });


  }






  clearNotifications():void{

    this.notifications.set([]);

  }






  // ==============================
  // CREATE E2EE ALERT
  // ==============================


  async createEncryptedAlert(
  request: CreateEncryptedAlertRequest
): Promise<void> {

  this.loading.set(true);
  this.error.set('');

  try {

    console.log('🚨 Début création alerte');


    const recipientPublicKey =
      await this.getRecipientPublicKey();



    const encrypted =
      await this.crypto.encryptForRecipient(
        request.message,
        recipientPublicKey
      );



    let latitude: number | undefined;
    let longitude: number | undefined;


    try {

      const position =
        await this.location.getCurrentPosition();


      latitude =
        position.latitude;

      longitude =
        position.longitude;


      console.log(
        "📍 Position utilisée:",
        latitude,
        longitude
      );


    } catch(error){

      console.warn(
        "⚠️ Localisation indisponible, création sans GPS",
        error
      );

    }



    const recipientUserId = this.resolveRecipientUserId();

    const payload:CreateAlertPayload = normalizeCreateAlertPayload({
      encrypted_content: encrypted.encrypted_content,
      encrypted_key: encrypted.encrypted_key,
      encrypted_content_nonce: encrypted.encrypted_content_nonce,
      encrypted_content_tag: encrypted.encrypted_content_tag,
      recipient_keys: [
        {
          recipient_user_id: recipientUserId,
          encrypted_key: encrypted.encrypted_key,
          key_encryption_algorithm: 'RSA-OAEP-SHA256',
        },
      ],
      latitude,
      longitude,
      severity: request.severity,
    });



    console.log(
      "🚨 Payload final envoyé:",
      payload
    );



    this.dashboard
      .createAlert(payload)
      .subscribe({

        next:(alert)=>{


          console.log(
            "✅ Alerte créée:",
            alert
          );


          this.alerts.update(
            alerts =>
            this.uniqueLatestAlerts(
              [
                alert,
                ...alerts
              ]
            )
          );


          this.loading.set(false);

        },


        error:(err)=>{


          console.error(
            "❌ Backend création alerte:",
            err
          );


          this.error.set(
            err?.error?.detail ??
            "Erreur création alerte"
          );


          this.loading.set(false);

        }


      });



  } catch(error){


    console.error(
      "❌ Erreur chiffrement/localisation:",
      error
    );


    this.error.set(
      error instanceof Error
      ? error.message
      : String(error)
    );


    this.loading.set(false);

  }


}







  private authUserId():any{


    const userId = this.auth.getCurrentUserId();



    if(!userId){

      throw new Error(
        'Utilisateur non connecté'
      );

    }



    return userId;


  }



  private resolveRecipientUserId(): string {
    const currentUserId = this.authUserId();

    if (this.isValidUuid(currentUserId)) {
      return currentUserId;
    }

    const fallbackId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

    console.warn('⚠️ Identifiant recipient invalide, fallback vers', fallbackId);

    return fallbackId;
  }



  private isValidUuid(value: unknown): value is string {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }



  // ==============================
  // UPDATE ALERT
  // ==============================


  updateAlert(
    alertId:string,
    payload:UpdateAlertPayload
  ):void{


    this.dashboard
    .updateAlert(alertId,payload)

    .subscribe({


      next:(updatedAlert)=>{


        const alert =
          this.toAlert(updatedAlert);



        if(alert){


          this.alerts.update(
            alerts =>
            this.uniqueLatestAlerts(

              [
                alert,

                ...alerts.filter(
                  item =>
                  item.id !== alert.id
                )

              ]

            )
          );

        }


      },


      error:(err)=>{


        this.error.set(
          err?.error?.detail ??
          "Erreur mise à jour alerte"
        );


      }

    });


  }






  // ==============================
  // WEBSOCKET
  // ==============================


  private handleSocketMessage(
    message:{
      type?:string;
      data?:unknown;
    }
  ):void{


    if(
      message.type==='initial_alerts'
      &&
      Array.isArray(message.data)
    ){


      const alerts =
      message.data

      .map(alert=>this.toAlert(alert))

      .filter(
        (alert):alert is Alert =>
        alert!==null
      );



      this.alerts.set(
        this.uniqueLatestAlerts(alerts)
      );


      return;

    }





    if(
      message.type==='new_alert'
      &&
      message.data
    ){


      const alert =
        this.toAlert(message.data);



      if(alert){

        this.alerts.update(
          alerts =>
          this.uniqueLatestAlerts(
            [
              alert,
              ...alerts
            ]
          )
        );

      }



      this.notifications.update(
        notifications =>
        this.uniqueLatestNotifications(
          [
            this.toNotification(message.data),
            ...notifications
          ]
        )
      );


    }

    if (message.type === 'alert_updated' && message.data) {
      const alert = this.toAlert(message.data);

      if (alert) {
        this.alerts.update(alerts => this.uniqueLatestAlerts([
          alert,
          ...alerts.filter(item => item.id !== alert.id),
        ]));
      }
    }


  }

  assignAlert(alertId: string, payload: import('../../models/alert').AssignAlertPayload): void {
    this.dashboard.assignAlert(alertId, payload).subscribe({
      next: updatedAlert => {
        const alert = this.toAlert(updatedAlert);
        if (alert) this.alerts.update(alerts => this.uniqueLatestAlerts([alert, ...alerts.filter(item => item.id !== alert.id)]));
      },
      error: err => this.error.set(err?.error?.detail ?? "Erreur d'affectation de l'alerte"),
    });
  }






  // ==============================
  // PUBLIC KEY
  // ==============================


  private async getRecipientPublicKey():Promise<JsonWebKey>{


    const stored =
      await this.keyStorage.getRecipientPublicKey();



    if(stored){

      return stored;

    }





    const generated =
      await this.crypto.generateKeyPair();



    const exported =
      await this.crypto.exportKeyPair(
        generated
      );




    await Promise.all([

      this.keyStorage.savePrivateKey(
        exported.privateKey
      ),


      this.keyStorage.savePublicKey(
        exported.publicKey
      ),


      this.keyStorage.saveRecipientPublicKey(
        exported.publicKey
      )

    ]);



    return exported.publicKey;


  }






  private toNotification(
    alert:unknown
  ):AdminAlertNotification{


    if(
      typeof alert !== 'object'
      ||
      alert===null
    ){

      return {
        message:String(alert)
      };

    }



    const notification =
      alert as AdminAlertNotification;



    return {

      ...notification,

      alert_id:
      notification.alert_id ??
      notification.id

    };


  }







  private toAlert(
    value:unknown
  ):Alert|null{


    if(
      typeof value !== 'object'
      ||
      value===null
      ||
      !('id' in value)
    ){

      return null;

    }



    return value as Alert;


  }






  private uniqueLatestAlerts(
    alerts:Alert[]
  ):Alert[]{


    const seen =
      new Set<string>();



    return this.sortAlertsByDate(alerts)

    .filter(alert=>{


      if(seen.has(alert.id)){

        return false;

      }


      seen.add(alert.id);

      return true;


    });


  }






  private sortAlertsByDate(
    alerts:Alert[]
  ):Alert[]{


    return [
      ...alerts
    ]

    .sort(
      (a,b)=>
      this.alertTime(b)-this.alertTime(a)
    );


  }






  private alertTime(
    alert:Alert
  ):number{


    const time =
      Date.parse(alert.created_at);



    return Number.isNaN(time)
      ? 0
      : time;


  }






  private uniqueLatestNotifications(
    notifications:AdminAlertNotification[]
  ):AdminAlertNotification[]{


    const seen =
      new Set<string>();



    return notifications

    .filter(notification=>{


      const key =
      this.notificationKey(notification);



      if(seen.has(key)){

        return false;

      }



      seen.add(key);

      return true;


    })

    .slice(0,this.notificationsLimit);


  }





  private notificationKey(
    notification:AdminAlertNotification
  ):string{


    return String(

      notification.alert_id ??
      notification.id ??
      notification.created_at ??
      notification.message ??
      JSON.stringify(notification)

    );


  }



}
