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
    { path: 'perfil/:id', component: PerfilComponent },
    { path: 'estadisticas', component: EstadisticasComponent },
    { path: 'casa-remates', component: CasaRemateComponent },
    { path: 'stream/:id', component: StreamComponent },
    { path: 'registro', component: RegisterComponent },
    { path: '', redirectTo: 'registro', pathMatch: 'full' }, 
];

