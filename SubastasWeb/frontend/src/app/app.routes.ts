import { Routes } from '@angular/router';
import { StreamComponent } from './stream/stream.component';
import { BuscadorRematesComponent } from './buscador-remates/buscador-remates.component';
import { PerfilComponent } from './perfil/perfil.component';
import { SubirProductoComponent } from './subir-producto/subir-producto.component';

export const routes: Routes = [
    { path: 'stream', loadComponent: () => StreamComponent },
    { path: 'buscadorRemates', loadComponent: () => BuscadorRematesComponent },
    { path: 'perfil', loadComponent: () => PerfilComponent },
    { path: 'subirProducto', loadComponent: () => SubirProductoComponent }
];
