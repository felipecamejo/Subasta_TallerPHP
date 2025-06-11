// src/app/app.routes.ts
import { Routes } from '@angular/router';

// Componentes de autenticación
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { GoogleLoginComponent } from './google-login/google-login.component';
import { LoginGoogleComponent } from './login-google.component/login-google.component'; 
import { RegistroGoogleComponent } from './registro-google/registro-google.component';

// Dashboards
import { DashboardClienteComponent } from './dashboards/dashboard-cliente/dashboard-cliente.component';
import { DashboardRematadorComponent } from './dashboards/dashboard-rematador/dashboard-rematador.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },

  // Botón de login con Google (flujo de inicio)
  { path: 'google-login', component: GoogleLoginComponent },

  // Callback desde el backend después de login con Google
  { path: 'login-google', component: LoginGoogleComponent },

    { path: 'registro-google', component: RegistroGoogleComponent },

  // Dashboards por rol
  { path: 'dashboard-cliente', component: DashboardClienteComponent },
  { path: 'dashboard-rematador', component: DashboardRematadorComponent },
];