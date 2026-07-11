import {
  CommonModule,
  DatePipe
} from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';


import {
  AdminAlertNotification,
  Alert,
  AlertSeverity,
  AlertStatus,
  CreateEncryptedAlertRequest,
  DashboardStatistics,
  UpdateAlertPayload
} from '../../../../models/alert';


import {
  AuthMeResponse
} from '../../../../models/user';


import {
  MapView
} from '../map-view/map-view';


import {
  DashboardSidebar,
  SidebarView
} from '../dashboard-sidebar/dashboard-sidebar';


import {
  Auth
} from '../../../../core/services/auth';


import {
  LocationService
} from '../../../../core/services/location.service';



@Component({

  selector:'app-tactical-dashboard',

  standalone:true,

  imports:[

    CommonModule,

    DatePipe,

    FormsModule,

    MapView,

    DashboardSidebar

  ],

  templateUrl:'./tactical-dashboard.html',

  changeDetection:ChangeDetectionStrategy.OnPush

})


export class TacticalDashboard {



private readonly authService = inject(Auth);

private readonly router = inject(Router);

private readonly locationService = inject(LocationService);





@Input()
alerts:Alert[]=[];


@Input()
currentUser:AuthMeResponse|null=null;


@Input()
loading=false;


@Input()
error='';


@Input()
adminNotifications:AdminAlertNotification[]=[];


@Input()
statistics:DashboardStatistics|null=null;





@Output()
refresh =
new EventEmitter<void>();



@Output()
createAlert =
new EventEmitter<CreateEncryptedAlertRequest>();



@Output()
updateAlert =
new EventEmitter<{

alertId:string;

payload:UpdateAlertPayload;

}>();



@Output()
clearNotifications =
new EventEmitter<void>();





selectedAlert:Alert|null=null;


activeView:SidebarView='dashboard';



severityFilter:
'all'|AlertSeverity='all';


statusFilter:
'all'|AlertStatus='all';



search='';



showCreateModal=false;



locating=false;



draft:CreateEncryptedAlertRequest={


message:'',

severity:'high'


};








get sidebarItems(): { key: SidebarView; label: string }[]{
  const adminItems: { key: SidebarView; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'alerts', label: 'Alertes' },
    { key: 'map', label: 'Carte' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'profile', label: 'Profil' },
    { key: 'settings', label: 'Paramètres' },
  ];

  const userItems: { key: SidebarView; label: string }[] = [
    { key: 'dashboard', label: 'Accueil' },
    { key: 'alerts', label: 'Mes alertes' },
    { key: 'map', label: 'Carte' },
    { key: 'profile', label: 'Profil' },
    { key: 'settings', label: 'Paramètres' },
  ];

  return this.isAdmin ? adminItems : userItems;
}






get isAdmin(){

return this.currentUser?.role==='admin';

}



get isUser(){

return this.currentUser?.role==='user';

}






get myAlerts(){


if(!this.currentUser){

return [];

}


return this.alerts.filter(

alert=>
alert.user_id===this.currentUser?.id

);


}






get visibleAlerts(){

return this.isAdmin

?

this.alerts

:

this.myAlerts;


}






get filteredAlerts(){


const query=this.search.toLowerCase();



return this.visibleAlerts.filter(alert=>{


const content=

`

${alert.id}

${alert.address ?? ''}

${alert.assigned_to ?? ''}

${this.locationLabel(alert)}

`

.toLowerCase();



return (

this.severityFilter==='all'

||

alert.severity===this.severityFilter

)

&&

(

this.statusFilter==='all'

||

alert.status===this.statusFilter

)

&&

content.includes(query);



});


}






get activeAlerts(){

return this.visibleAlerts.filter(

a=>a.status==='active'

).length;

}



get criticalAlerts(){

return this.visibleAlerts.filter(

a=>a.severity==='high'

).length;

}



get acknowledgedAlerts(){

return this.visibleAlerts.filter(

a=>a.status==='acknowledged'

).length;

}



get resolvedAlerts(){

return this.visibleAlerts.filter(

a=>a.status==='resolved'

).length;

}



get mediumAlerts(){

return this.visibleAlerts.filter(

a=>a.severity==='medium'

).length;

}



get lowAlerts(){

return this.visibleAlerts.filter(

a=>a.severity==='low'

).length;

}








severityClass(
severity:AlertSeverity
){


return {

high:
'bg-red-50 text-red-800 border border-red-200',

medium:
'bg-amber-50 text-amber-800 border border-amber-200',

low:
'bg-emerald-50 text-emerald-800 border border-emerald-200'

}[severity];


}







notificationLabel(
notification:AdminAlertNotification
){


if(notification.message?.trim()){

return notification.message;

}



if(notification.alert_id){

return `Nouvelle alerte #${notification.alert_id.slice(0,8)}`;

}


return 'Nouvelle notification';


}







openAlert(alert:Alert){

this.selectedAlert=alert;

}




closeDrawer(){

this.selectedAlert=null;

}






markStatus(
alert:Alert,
status:AlertStatus
){


this.updateAlert.emit({

alertId:alert.id,

payload:{
status
}

});


}







openCreateModal(){

this.showCreateModal=true;

}









async submitCreate(){



if(!this.draft.message.trim()){


this.error=
"Le message est obligatoire";


return;


}



this.locating=true;



try{


let latitude:number|undefined;

let longitude:number|undefined;

let accuracy:number|undefined;



try{


const position =
await this.locationService.getCurrentPosition();



latitude=
position.latitude;


longitude=
position.longitude;


accuracy=
position.accuracy;



console.log(
"📍 GPS:",
{
latitude,
longitude,
accuracy
}
);



}

catch(error){


console.warn(
"GPS indisponible",
error
);


}





const payload:CreateEncryptedAlertRequest={


message:
this.draft.message.trim(),


severity:
this.draft.severity,


latitude,


longitude,


accuracy


};





console.log(
"🚨 Payload avant chiffrement:",
payload
);





this.createAlert.emit(payload);



this.resetDraft();


this.showCreateModal=false;



}


finally{


this.locating=false;


}



}









private resetDraft(){


this.draft={


message:'',


severity:'high'


};


}








locationLabel(alert:Alert){


if(alert.address){

return alert.address;

}



const lat =
alert.location?.coordinates?.[1]
??
alert.latitude;



const lng =
alert.location?.coordinates?.[0]
??
alert.longitude;



return `${lat}, ${lng}`;


}







deconnexion(){


this.authService.removeToken();


this.router.navigate(['/login']);


}



}