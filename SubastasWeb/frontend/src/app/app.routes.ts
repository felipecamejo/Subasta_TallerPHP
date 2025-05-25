import { Routes } from '@angular/router';
import { StreamComponent } from './stream/stream.component';
import { BuscadorRematesComponent } from './buscador-remates/buscador-remates.component';

export const routes: Routes = [
    { path: 'stream', loadComponent: () => StreamComponent },
    { path: 'buscadorRemates', loadComponent: () => BuscadorRematesComponent },
];
