import { environment } from '../../environments/environment';
import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
        this.authService.login({
          token: res.token,
          usuario_id: res.usuario_id,
          rol: res.rol || 'cliente',
          usuario: res.usuario
        });

        // ✅ Corrección del error con "??"
        this.userEmail = res.usuario?.email || this.loginData.email;

        // Enviar notificación de bienvenida si no es admin
        if (res.rol !== 'admin') {
          this.notificacionService.crearNotificacion(
            'Bienvenido',
            'Te damos la bienvenida al sistema',
            res.usuario_id,
            false,
            null
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

  logout(): void {
    const token = this.authService.getToken();
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post<any>(`${environment.apiUrl}/api/logout`, {}, { headers }).subscribe({
      next: () => {
        this.authService.logout();
        this.userEmail = '';
      },
      error: () => alert('Error al cerrar sesión'),
    });
  }
}
