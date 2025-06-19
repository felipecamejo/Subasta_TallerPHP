import { Routes } from '@angular/router';

import { StreamComponent } from './stream/stream.component';
import { LoginComponent } from './login/login.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { CasaRemateComponent } from './casa-remate/casa-remate.component';
import { BuscadorRematesComponent } from './buscador-remates/buscador-remates.component';
import { PerfilComponent } from './perfil/perfil.component';
import { RegisterComponent } from './register/register.component';
import { GoogleLoginComponent } from './google-login/google-login.component';
import { LoginGoogleComponent } from './login-google.component/login-google.component';
import { RegistroGoogleComponent } from './registro-google/registro-google.component';
import { ChatComponent } from './chat/chat.component';
import { TestChatComponent } from './test-chat/test-chat.component';
import { VerificarEmailComponent } from './verificar-email/verificar-email.component';
import { EmailVerificadoComponent } from './email-verificado/email-verificado.component';
import { VerificacionPendienteComponent } from './verificacion-pendiente/verificacion-pendiente.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';


// Dashboards
import { DashboardClienteComponent } from './dashboards/dashboard-cliente/dashboard-cliente.component';
import { DashboardRematadorComponent } from './dashboards/dashboard-rematador/dashboard-rematador.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { CasaRemateDashboardComponent } from './casa-remate-dashboard/casa-remate-dashboard.component';

export const routes: Routes = [
  
  { path: 'chat/:chatId', component: ChatComponent }, // Nueva ruta para chat
  { path: 'test-chat', component: TestChatComponent }, // Ruta para pruebas
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'google-login', component: GoogleLoginComponent },
  { path: 'login-google', component: LoginGoogleComponent },
  { path: 'registro-google', component: RegistroGoogleComponent },
  { path: 'verificar-email', component: VerificarEmailComponent },
  { path: 'email-verificado', component: EmailVerificadoComponent },
  { path: 'verificacion-pendiente', component: VerificacionPendienteComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'restablecer-contrasena', component: ResetPasswordComponent },

  // Componentes funcionales
  { path: 'casa-remates', loadComponent: () => CasaRemateComponent },
  { path: 'stream/:id', loadComponent: () => StreamComponent },
  { path: 'perfil/:id', loadComponent: () => PerfilComponent },
  { path: 'estadisticas', loadComponent: () => EstadisticasComponent },
  { path: 'buscadorRemates', loadComponent: () => BuscadorRematesComponent },

  // Cosas del admin
  { path: 'admin/aprobar-casas', loadComponent: () => import('./admin/aprobar-casas/aprobar-casas.component').then(m => m.AdminAprobarCasasComponent) },
  { path: 'admin/desaprobar-casas', loadComponent: () => import('./admin/desaprobar-casas/desaprobar-casas.component').then(m => m.DesaprobarCasasComponent) },
 

  // Dashboards
  { path: 'dashboard-cliente', component: DashboardClienteComponent },
  { path: 'dashboard-rematador', component: DashboardRematadorComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'dashboard-casa-remate', component: CasaRemateDashboardComponent },

  // Ruta por defecto en caso de error
  { path: '**', redirectTo: 'login' },
];
