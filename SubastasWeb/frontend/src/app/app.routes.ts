import { Routes } from '@angular/router';
import { StreamComponent } from './stream/stream.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
    { path: 'stream', loadComponent: () => StreamComponent },
    { path: 'login', component: LoginComponent },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];

