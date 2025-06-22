import { Routes } from '@angular/router';

import { StreamComponent } from './stream/stream.component';
import { LoginComponent } from './login/login.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { CasaRemateComponent } from './casa-remate/casa-remate.component';
import { BuscadorRematesComponent } from './buscador-remates/buscador-remates.component';
import { PerfilComponent } from './perfil/perfil.component';
import { RegisterComponent } from './register/register.component';
import { GoogleLoginComponent } from './google-login/google-login.component';
import { ChatComponent } from './chat/chat.component';
import { TestChatComponent } from './test-chat/test-chat.component';
import { VerificarEmailComponent } from './verificar-email/verificar-email.component';
import { EmailVerificadoComponent } from './email-verificado/email-verificado.component';
import { VerificacionPendienteComponent } from './verificacion-pendiente/verificacion-pendiente.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { RedirectorComponent } from './redirector/redirector.component';

// Dashboards
import { DashboardClienteComponent } from './dashboards/dashboard-cliente/dashboard-cliente.component';
import { DashboardRematadorComponent } from './dashboards/dashboard-rematador/dashboard-rematador.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { CasaRemateDashboardComponent } from './casa-remate-dashboard/casa-remate-dashboard.component';

export const routes: Routes = [
  { path: 'chat/:chatId', component: ChatComponent },
  { path: 'test-chat', component: TestChatComponent },
  
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'google-login', component: GoogleLoginComponent },
  
  { path: 'google-login', component: GoogleLoginComponent },

  // ✅ Standalone cargado correctamente:
  {
    path: 'registro-google',
    loadComponent: () =>
      import('./registro-google/registro-google.component').then(m => m.RegistroGoogleComponent)
  },

  { path: 'verificar-email', component: VerificarEmailComponent },
  { path: 'email-verificado', component: EmailVerificadoComponent },
  { path: 'verificacion-pendiente', component: VerificacionPendienteComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'restablecer-contrasena', component: ResetPasswordComponent },

  { path: 'casa-remates', loadComponent: () => CasaRemateComponent },
  { path: 'stream/:id', loadComponent: () => StreamComponent },
  { path: 'perfil/:id', loadComponent: () => PerfilComponent },
  { path: 'estadisticas', loadComponent: () => EstadisticasComponent },
  { path: 'buscadorRemates', loadComponent: () => BuscadorRematesComponent },
  { path: '', component: RedirectorComponent },

  { path: 'admin/aprobar-casas', loadComponent: () => import('./admin/aprobar-casas/aprobar-casas.component').then(m => m.AdminAprobarCasasComponent) },
  { path: 'admin/desaprobar-casas', loadComponent: () => import('./admin/desaprobar-casas/desaprobar-casas.component').then(m => m.DesaprobarCasasComponent) },
  { path: 'admin/usuarios', loadComponent: () => import('./admin/admin-usuarios/admin-usuarios.component').then(m => m.AdminUsuariosComponent), title: 'Administrar usuarios' },

  { path: 'dashboard-cliente', component: DashboardClienteComponent },
  { path: 'dashboard-rematador', component: DashboardRematadorComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'dashboard-casa-remate', component: CasaRemateDashboardComponent },
  {
  path: 'testeo',
  loadComponent: () => import('./testeo/testeo.component').then(m => m.TesteoComponent)
},
{
  path: 'login-google',
  loadComponent: () =>
    import('./login-google/login-google.component').then(m => m.LoginGoogleComponent),
},

  { path: '**', redirectTo: '' },
];
