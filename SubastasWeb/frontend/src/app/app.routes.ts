import { Routes } from '@angular/router';
import { StreamComponent } from './stream/stream.component';
import { LoginComponent } from './login/login.component';
import { PerfilComponent } from './perfil/perfil.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';

export const routes: Routes = [
    { path: 'stream/:id', loadComponent: () => StreamComponent },
    { path: 'perfil/:id', loadComponent: () => PerfilComponent },
    { path: 'estadisticas', loadComponent: () => EstadisticasComponent },
];

