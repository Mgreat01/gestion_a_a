import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Alert, AlertSeverity, AlertStatus, CreateAlertPayload, UpdateAlertPayload } from '../../../../models/alert';
import { AuthMeResponse } from '../../../../models/user';
import { MapView } from '../map-view/map-view';
import { DashboardSidebar, SidebarView } from '../dashboard-sidebar/dashboard-sidebar';
@Component({selector:'app-tactical-dashboard',standalone:true,imports:[CommonModule,DatePipe,FormsModule,MapView,DashboardSidebar],templateUrl:'./tactical-dashboard.html'})
export class TacticalDashboard{
@Input() alerts:Alert[]=[];@Input() currentUser:AuthMeResponse|null=null;@Input() loading=false;@Input() error='';
@Output() refresh=new EventEmitter<void>();@Output() createAlert=new EventEmitter<CreateAlertPayload>();@Output() updateAlert=new EventEmitter<{alertId:string,payload:UpdateAlertPayload}>();
selectedAlert:Alert|null=null;activeView:SidebarView='dashboard';severityFilter:'all'|AlertSeverity='all';statusFilter:'all'|AlertStatus='all';search='';showCreateModal=false;creating=false;
draft:CreateAlertPayload={encrypted_content:'',encrypted_key:'',latitude:0,longitude:0,severity:'high'};
get isAdmin(){return this.currentUser?.role==='admin'} get isUser(){return this.currentUser?.role==='user'}
get filteredAlerts(){return this.alerts.filter(a=>(this.severityFilter==='all'||a.severity===this.severityFilter)&&(this.statusFilter==='all'||a.status===this.statusFilter)&&(`${a.id} ${a.assigned_to??''} ${a.location??''}`.toLowerCase().includes(this.search.toLowerCase())))}
get activeAlerts(){return this.alerts.filter(a=>a.status==='active').length} get criticalAlerts(){return this.alerts.filter(a=>a.severity==='high').length} get acknowledgedAlerts(){return this.alerts.filter(a=>a.status==='acknowledged').length} get resolvedAlerts(){return this.alerts.filter(a=>a.status==='resolved').length}
severityClass(s:AlertSeverity){return s==='high'?'bg-rose-500/15 text-rose-200 border-rose-400/30':s==='medium'?'bg-amber-500/15 text-amber-200 border-amber-400/30':'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'}
openAlert(a:Alert){this.selectedAlert=a;} closeDrawer(){this.selectedAlert=null;} markStatus(a:Alert,status:AlertStatus){this.updateAlert.emit({alertId:a.id,payload:{status}})}
submitCreate(){this.createAlert.emit({...this.draft}); this.showCreateModal=false; this.draft={encrypted_content:'',encrypted_key:'',latitude:0,longitude:0,severity:'high'};}
}
