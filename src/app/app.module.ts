import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { HttpClientModule } from '@angular/common/http'; 
import { RouteReuseStrategy } from '@angular/router';

import { HomeComponent } from './home/home.component';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SettingsComponent } from './settings/settings.component';
import { AccountComponent } from './settings/account/account.component';
import { ApplicationComponent } from './settings/application/application.component';
import { ThemeComponent } from './settings/theme/theme.component';
import { ChoicewindowComponent } from './choicewindow/choicewindow.component';
import { EventsComponent } from './events/events.component';
import { IncidentsComponent } from './incidents/incidents.component';
import { LogsComponent } from './logs/logs.component';
import { MetricsComponent } from './metrics/metrics.component';
import { OverviewComponent } from './overview/overview.component';
import { TeamComponent } from './team/team.component';
import { UptimeComponent } from './uptime/uptime.component';

import { TopBarComponent, PopoverContentDynamicComponent } from './topbar/topbar.component';
import { DockerInfoPopoverComponent } from './settings/application/docker-info-popover/docker-info-popover.component';
import { ChoiceInfoPopoverComponent } from './choicewindow/choice-info-popover/choice-info-popover.component';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';


@NgModule({
  declarations: [HomeComponent, AppComponent, LoginComponent, LogoutComponent, DashboardComponent, 
    SettingsComponent, AccountComponent, ApplicationComponent, ThemeComponent, ChoicewindowComponent,
    EventsComponent, IncidentsComponent, LogsComponent, MetricsComponent, OverviewComponent, TeamComponent, UptimeComponent,
    TopBarComponent, 
    PopoverContentDynamicComponent, ChoiceInfoPopoverComponent, DockerInfoPopoverComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule, DragDropModule, FormsModule, NgChartsModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
