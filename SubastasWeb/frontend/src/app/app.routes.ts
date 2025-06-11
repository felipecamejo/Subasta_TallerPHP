import { Routes } from '@angular/router';
import { StreamComponent } from './stream/stream.component';
import { BuscadorRematesComponent } from './buscador-remates/buscador-remates.component';
import { PerfilComponent } from './perfil/perfil.component';
import { LoginComponent } from './login/login.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { CasaRemateComponent } from './casa-remate/casa-remate.component';
import { RegisterComponent } from './register/register.component';
import { GoogleLoginComponent } from './google-login/google-login.component';
import { LoginGoogleComponent } from './login-google.component/login-google.component'; 
import { RegistroGoogleComponent } from './registro-google/registro-google.component';
import { VerificarEmailComponent } from './verificar-email/verificar-email.component';
import { EmailVerificadoComponent } from './email-verificado/email-verificado.component';

// Dashboards
import { DashboardClienteComponent } from './dashboards/dashboard-cliente/dashboard-cliente.component';
import { DashboardRematadorComponent } from './dashboards/dashboard-rematador/dashboard-rematador.component';

export const routes: Routes = [
    { path: 'stream/:id', component: StreamComponent },
    { path: 'buscadorRemates', component: BuscadorRematesComponent },
    { path: 'perfil/:id', component: PerfilComponent },
    { path: 'estadisticas', component: EstadisticasComponent },
    { path: 'casa-remates', component: CasaRemateComponent },
    { path: 'registro', component: RegisterComponent },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'google-login', component: GoogleLoginComponent },
    { path: 'login-google', component: LoginGoogleComponent },
    { path: 'registro-google', component: RegistroGoogleComponent },
    { path: 'dashboard-cliente', component: DashboardClienteComponent },
    { path: 'dashboard-rematador', component: DashboardRematadorComponent },
    { path: 'verificar-email', component: VerificarEmailComponent },
    { path: 'email-verificado', component: EmailVerificadoComponent },
    { path: '**', redirectTo: 'login' }
];
