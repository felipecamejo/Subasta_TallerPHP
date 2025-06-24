import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verificacion-pendiente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verificacion-pendiente.component.html',
  styleUrls: ['./verificacion-pendiente.component.scss']
})
export class VerificacionPendienteComponent {
  mensaje = '';
  error = '';
  loading = false;
  email = localStorage.getItem('email_para_verificar') || '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  reenviarCorreo() {
    if (!this.email) {
      this.error = 'No se encontró el email para reenviar la verificación.';
      return;
    }

    this.loading = true;

    this.authService.reenviarVerificacionEmail(this.email).subscribe({
      next: () => {
        this.mensaje = 'Correo de verificación reenviado correctamente.';
        this.loading = false;
        localStorage.removeItem('email_para_verificar');
      },
      error: (err) => {
        this.error = err.error?.message || 'Hubo un problema al reenviar el correo.';
        this.loading = false;
      }
    });
  }

  irAlLogin() {
    this.router.navigate(['/login']);
  }
}
