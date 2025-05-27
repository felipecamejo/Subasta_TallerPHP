import { Routes } from '@angular/router';
import { StreamComponent } from './stream/stream.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { BuscadorRematesComponent } from './buscador-remates/buscador-remates.component';

export const routes: Routes = [
    { path: 'stream', loadComponent: () => StreamComponent },
    { path: 'estadisticas', loadComponent: () => EstadisticasComponent },
    { path: 'buscadorRemtaes', loadComponent: () => BuscadorRematesComponent },
];
