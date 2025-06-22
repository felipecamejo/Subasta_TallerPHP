import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { EmailResendRequest } from '../../models/emailResendRequest';

@Component({
  selector: 'app-verificacion-pendiente',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './verificacion-pendiente.component.html',
  styleUrls: ['./verificacion-pendiente.component.scss']
})
export class VerificacionPendienteComponent {
  mensaje = '';
  error = '';
  loading = false;
  email = localStorage.getItem('email_para_verificar') || '';

  constructor(private authService: AuthService) {}

  reenviarCorreo(): void {
    if (!this.email) {
      this.error = 'No se encontró el email para reenviar la verificación.';
      return;
    }

    this.loading = true;
    const payload: EmailResendRequest = { email: this.email };

    this.authService.reenviarVerificacionEmail(payload).subscribe({
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
}
