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
  items: MenuItem[] = [];

  usuarioId: number | null = null;
  isLoggedIn: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const rol = this.authService.getRol();

    // Redirige a diferentes rutas según el rol
    if (rol === 'admin') {
      this.items = [{ label: 'Home', routerLink: ['/admin'] }];
    } else {
      this.items = [{ label: 'Home', routerLink: ['/buscadorRemates'] }];
    }

    this.usuarioId = this.authService.getUsuarioId();
    this.isLoggedIn = this.authService.isLoggedIn();

    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      this.isLoggedIn = isAuthenticated;
      if (isAuthenticated) {
        this.usuarioId = this.authService.getUsuarioId();
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}

