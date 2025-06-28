import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { NotificacionesComponent } from '../notificaciones/notificaciones.component';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
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
    DialogModule,
    TooltipModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  items: MenuItem[] = [
    { label: 'Home', routerLink: ['/buscadorRemates'] },
  ];

  usuarioId: number | null = null;
  isLoggedIn: boolean = false;
  userRole: string | null = null;
  isCasaRemate: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.usuarioId = this.authService.getUsuarioId();
    this.isLoggedIn = this.authService.isLoggedIn();
    this.userRole = localStorage.getItem('rol');
    this.isCasaRemate = this.userRole === 'casa_remate';
    
    // Suscribirse a cambios en el estado de autenticación
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      this.isLoggedIn = isAuthenticated;
      if (isAuthenticated) {
        this.usuarioId = this.authService.getUsuarioId();
        this.userRole = localStorage.getItem('rol');
        this.isCasaRemate = this.userRole === 'casa_remate';
      } else {
        this.userRole = null;
        this.isCasaRemate = false;
      }
    });
  }
  
  logout(): void {
    this.authService.logout();
    // Opcional: redirigir a la página de login
    // this.router.navigate(['/login']);
  }
}