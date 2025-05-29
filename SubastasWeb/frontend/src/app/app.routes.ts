import { Routes } from '@angular/router';
import { StreamComponent } from './stream/stream.component';
import { LoginComponent } from './login/login.component';
import { PerfilComponent } from './perfil/perfil.component';

export const routes: Routes = [
    { path: 'stream/:id', loadComponent: () => StreamComponent },
    { path: 'perfil/:id', loadComponent: () => PerfilComponent },
];

