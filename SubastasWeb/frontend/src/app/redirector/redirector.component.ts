import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-redirector',
  standalone: true,
  template: `<p>Redireccionando al dashboard...</p>`
})
export class RedirectorComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.obtenerDatosAutenticado().subscribe({
      next: (usuario) => {
        switch (usuario.rol) {
          case 'admin':
            this.router.navigate(['/admin']);
            break;
          case 'cliente':
            this.router.navigate(['/dashboard-cliente']);
            break;
          case 'rematador':
            this.router.navigate(['/dashboard-rematador']);
            break;
          case 'casa_remate':
            this.router.navigate(['/dashboard-casa-remate']);
            break;
          default:
            this.router.navigate(['/login']);
        }
      },
      error: () => {
        // Si el token es inválido, o expiró
        this.authService.logout();
      }
    });
  }
}
