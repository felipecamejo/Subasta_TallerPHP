import { Routes } from '@angular/router';
import { StreamComponent } from './stream/stream.component';
import { LoginComponent } from './login/login.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { CasaRemateComponent } from './casa-remate/casa-remate.component';

export const routes: Routes = [
    { path: 'stream/:id', loadComponent: () => StreamComponent },
    { path: 'estadisticas', loadComponent: () => EstadisticasComponent },
    { path: 'casa-remates', loadComponent: () => CasaRemateComponent },
];

