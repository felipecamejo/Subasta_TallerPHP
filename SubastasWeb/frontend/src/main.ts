import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import 'primeicons/primeicons.css';
import 'primeng/resources/themes/lara-light-blue/theme.css';
import 'primeng/resources/primeng.min.css';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
