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
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (token && email) {
      this.isLoggedIn = true;
      this.userEmail = email;
    }

    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isLoggedIn = isAuth;
    });
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
  }

  onLogin(): void {
    this.http.post<any>('http://localhost:8000/api/login', this.loginData).subscribe({
      next: (res) => {
        const token = res.token;
        const usuarioId = res.usuario_id;
        const rol = res.rol || 'cliente'; // por si no viene, asumimos cliente

        this.authService.login(token, this.loginData.email, usuarioId, rol);
        this.userEmail = this.loginData.email;

        // Enviar notificación de bienvenida solo si no es admin
        if (rol !== 'admin') {
          this.notificacionService.crearNotificacion(
            'Bienvenido',
            'Te damos la bienvenida al sistema',
            usuarioId,
            false,
            null
          ).subscribe({
            next: () => console.log('Notificación enviada'),
            error: (err) => console.error('Error al enviar notificación', err)
          });
        }
      },
      error: (err) => alert('Login fallido: ' + err.error.error),
    });
  }

  onRegister(): void {
    this.http.post<any>('http://localhost:8000/api/register', this.registerData).subscribe({
      next: () => {
        alert('Registrado con éxito, ahora inicia sesión');
        this.toggleMode();
      },
      error: (err) => alert('Error en registro: ' + JSON.stringify(err.error)),
    });
  }

  logout(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post<any>('http://localhost:8000/api/logout', {}, { headers }).subscribe({
      next: () => {
        this.authService.logout();
        this.userEmail = '';
      },
      error: () => alert('Error al cerrar sesión'),
    });
  }
}
