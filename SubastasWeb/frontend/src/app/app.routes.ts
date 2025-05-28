import { Routes } from '@angular/router';
import { StreamComponent } from './stream/stream.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { BuscadorRematesComponent } from './buscador-remates/buscador-remates.component';
import { CasaRemateComponent } from './casa-remate/casa-remate.component';
import { PerfilComponent } from './perfil/perfil.component';
import { SubirProductoComponent } from './subir-producto/subir-producto.component';

export const routes: Routes = [
    { path: 'stream/:id', loadComponent: () => StreamComponent },
    { path: 'estadisticas', loadComponent: () => EstadisticasComponent },
    { path: 'buscadorRemtaes', loadComponent: () => BuscadorRematesComponent },
    { path: 'buscadorRemates', loadComponent: () => BuscadorRematesComponent },
    { path: 'casaRemate', loadComponent: () => CasaRemateComponent},
    { path: 'perfil', loadComponent: () => PerfilComponent },
    { path: 'subirProducto', loadComponent: () => SubirProductoComponent }
];
