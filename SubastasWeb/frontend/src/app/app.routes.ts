import { Routes } from '@angular/router';
import { StreamComponent } from './stream/stream.component';

export const routes: Routes = [
    { path: 'stream', loadComponent: () => StreamComponent },
];
