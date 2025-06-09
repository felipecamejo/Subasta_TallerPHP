import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { NotificacionesComponent } from '../notificaciones/notificaciones.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NotificacionesComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  items: MenuItem[] = [
    { label: 'Home', routerLink: ['/'] },
    { label: 'Categories', routerLink: ['/categories'] },
    { label: 'Authors', routerLink: ['/authors'] },
    { label: 'Shop', routerLink: ['/shop'] },
    { label: 'Contact', routerLink: ['/contact'] }
  ];
}