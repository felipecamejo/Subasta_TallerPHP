import { Routes } from '@angular/router';
import { StreamComponent } from './stream/stream.component';
import { BuscadorRematesComponent } from './buscador-remates/buscador-remates.component';

export const routes: Routes = [
    { path: 'stream/:id', component: StreamComponent },
    { path: 'buscadorRemates', component: BuscadorRematesComponent}
];

