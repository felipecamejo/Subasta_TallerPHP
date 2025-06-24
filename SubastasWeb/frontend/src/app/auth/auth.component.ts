import { environment } from '../../environments/environment';
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { NotificacionService } from '../../services/notificacion.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
})
export class AuthComponent {
  isLoginMode = true;

  loginData = { email: '', password: '' };

  registerData: any = {
    nombre: '',
    email: '',
    contrasenia: '',
    contrasenia_confirmation: '',
    tipo: '', // cliente | rematador | casa_remate
    cedula: '',
    telefono: '',
    matricula: '',
    idFiscal: '',
    latitud: null,
    longitud: null
  };

  isLoggedIn = false;
  userEmail = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificacionService: NotificacionService
  ) {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    if (auth?.token && auth?.usuario?.email) {
      this.isLoggedIn = true;
      this.userEmail = auth.usuario.email;
    }

    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isLoggedIn = isAuth;
    });
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
  }

  onLogin(): void {
    this.http.post<any>(`${environment.apiUrl}/api/login`, this.loginData).subscribe({
      next: (res) => {
        const usuarioId: number = Number(res.usuario_id ?? 0);

        this.authService.login({
          token: res.token,
          usuario_id: usuarioId,
          rol: res.rol || 'cliente',
          usuario: res.usuario
        });

        this.userEmail = res.usuario?.email || this.loginData.email;

        if (res.rol !== 'admin' && !isNaN(usuarioId) && usuarioId > 0) {
          this.notificacionService.crearNotificacion(
            'Bienvenido',
            'Te damos la bienvenida al sistema',
            usuarioId,
            false,
            0 //  Pasamos 0 en lugar de null para evitar error de tipo
          ).subscribe({
            next: () => console.log('Notificación enviada'),
            error: (err) => console.error('Error al enviar notificación', err)
          });
        }
      },
      error: (err) => alert('Login fallido: ' + (err.error?.error || 'Error desconocido')),
    });
  }

  onRegister(): void {
    this.http.post<any>(`${environment.apiUrl}/api/register`, this.registerData).subscribe({
      next: () => {
        alert('Registrado con éxito, ahora inicia sesión');
        this.toggleMode();
      },
      error: (err) => alert('Error en registro: ' + JSON.stringify(err.error)),
    });
  }
}
