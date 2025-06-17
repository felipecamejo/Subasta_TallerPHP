import { environment } from '../../environments/environment';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-verificacion-pendiente',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './verificacion-pendiente.component.html',
  styleUrls: ['./verificacion-pendiente.component.scss']
})
export class VerificacionPendienteComponent {
  mensaje: string = '';
  error: string = '';
  loading: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  reenviarCorreo() {
    this.loading = true;
    this.mensaje = '';
    this.error = '';

    this.http.post(`${environment.apiUrl}/api/email/resend`, {}).subscribe({
      next: (res: any) => {
        this.mensaje = 'Correo de verificación reenviado correctamente.';
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Hubo un problema al reenviar el correo.';
        this.loading = false;
      }
    });
  }
}
