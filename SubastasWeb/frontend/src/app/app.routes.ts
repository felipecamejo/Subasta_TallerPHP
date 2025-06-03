import { Routes } from '@angular/router';
import { StreamComponent } from './stream/stream.component';
import { BuscadorRematesComponent } from './buscador-remates/buscador-remates.component';
import { PerfilComponent } from './perfil/perfil.component';
import { LoginComponent } from './login/login.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { CasaRemateComponent } from './casa-remate/casa-remate.component';
import { RegisterComponent } from './register/register.component';


export const routes: Routes = [
    { path: 'stream/:id', component: StreamComponent },
    { path: 'buscadorRemates', component: BuscadorRematesComponent},
    { path: 'perfil/:id', loadComponent: () => PerfilComponent },
    { path: 'estadisticas', loadComponent: () => EstadisticasComponent },
    { path: 'casa-remates', loadComponent: () => CasaRemateComponent },
    { path: 'stream/:id', loadComponent: () => StreamComponent },
    { path: 'registro', component: RegisterComponent },
    { path: '', redirectTo: 'registro', pathMatch: 'full' }, 
];

