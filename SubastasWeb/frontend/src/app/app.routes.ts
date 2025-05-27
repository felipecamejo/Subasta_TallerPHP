import { Routes } from '@angular/router';
import { StreamComponent } from './stream/stream.component';
import { BuscadorRematesComponent } from './buscador-remates/buscador-remates.component';
import { CasaRemateComponent } from './casa-remate/casa-remate.component';

export const routes: Routes = [
    { path: 'stream', loadComponent: () => StreamComponent },
    { path: 'buscadorRemates', loadComponent: () => BuscadorRematesComponent },
    { path: 'casaRemate', loadComponent: () => CasaRemateComponent},
];
