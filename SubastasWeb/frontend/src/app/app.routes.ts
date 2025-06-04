import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { AuthSelectorComponent } from './auth-selector/auth-selector.component';

export const routes: Routes = [
  { path: '', component: AuthSelectorComponent },  // Pantalla inicial con botones Login y Registro
  { path: 'register', component: RegisterComponent }, 
  { path: 'login', component: LoginComponent },
  // Podés agregar aquí rutas para otras páginas, por ejemplo home, dashboard, etc.
];