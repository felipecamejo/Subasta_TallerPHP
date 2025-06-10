import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { NotificacionesComponent } from '../notificaciones/notificaciones.component';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NotificacionesComponent,
    ButtonModule,
    BadgeModule,
    DialogModule
  ],
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