import { Routes } from '@angular/router';
import { StreamComponent } from './stream/stream.component';
import { RegisterComponent } from './register/register.component';


export const routes: Routes = [
  { path: 'stream/:id', loadComponent: () => StreamComponent },
  { path: 'registro', component: RegisterComponent },
  { path: '', redirectTo: 'registro', pathMatch: 'full' }, // opcional: redirige a registro por defecto
];

