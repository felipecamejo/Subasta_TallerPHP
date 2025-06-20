import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

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

  constructor(private http: HttpClient) {}

  reenviarCorreo() {
    if (!this.email) {
      this.error = 'No se encontró el email para reenviar la verificación.';
      return;
    }

    this.loading = true;
    this.http.post(`${environment.apiUrl}/api/email/resend`, { email: this.email }).subscribe({
      next: (res: any) => {
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
