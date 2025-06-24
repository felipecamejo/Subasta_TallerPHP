import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { NotificacionesComponent } from '../notificaciones/notificaciones.component';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../services/auth.service';

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
export class HeaderComponent implements OnInit {
  items: MenuItem[] = [
    { label: 'Home', routerLink: ['/buscadorRemates'] },
    { label: 'Categories', routerLink: ['/categories'] },
    { label: 'Authors', routerLink: ['/authors'] },
    { label: 'Shop', routerLink: ['/shop'] },
    { label: 'Contact', routerLink: ['/contact'] }
  ];

  usuarioId: number | null = null;
  isLoggedIn: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.usuarioId = this.authService.getUsuarioId();
    this.isLoggedIn = this.authService.isLoggedIn();
    
    // Suscribirse a cambios en el estado de autenticación
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      this.isLoggedIn = isAuthenticated;
      if (isAuthenticated) {
        this.usuarioId = this.authService.getUsuarioId();
      }
    });
  }
}