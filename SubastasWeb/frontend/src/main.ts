import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config'; // <- Importás la config general

bootstrapApplication(AppComponent, appConfig);