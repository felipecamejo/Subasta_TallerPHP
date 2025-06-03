import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
})
export class AuthComponent {
  isLoginMode = true;

  loginData = { email: '', password: '' };
  registerData: any = { nombre: '', email: '', contrasenia: '', tipo: '', matricula: '' };

  isLoggedIn = false;
  userEmail = '';

  constructor(private http: HttpClient) {
    // Verificar si hay token guardado
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (token && email) {
      this.isLoggedIn = true;
      this.userEmail = email;
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  onLogin() {
    this.http.post<any>('http://tu-backend/api/login', this.loginData).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('email', this.loginData.email);
        this.isLoggedIn = true;
        this.userEmail = this.loginData.email;
      },
      error: (err) => alert('Login fallido: ' + err.error.error),
    });
  }

  onRegister() {
    this.http.post<any>('http://tu-backend/api/register', this.registerData).subscribe({
      next: (res) => {
        alert('Registrado con éxito, ahora inicia sesión');
        this.toggleMode();
      },
      error: (err) => alert('Error en registro: ' + JSON.stringify(err.error)),
    });
  }

  logout() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.http.post<any>('http://tu-backend/api/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: () => {
        localStorage.clear();
        this.isLoggedIn = false;
        this.userEmail = '';
      },
      error: () => alert('Error al cerrar sesión'),
    });
  }
}
