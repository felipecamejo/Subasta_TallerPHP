import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-logout-button',
  standalone: true,
  imports: [CommonModule],
  template: `<button (click)="logout()">Cerrar sesión</button>`,
})
export class LogoutButtonComponent {
  constructor(private http: HttpClient, private router: Router) {}

  logout() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http.post('http://localhost:8000/api/logout', {}, { headers }).subscribe({
      next: () => this.limpiarSesion(),
      error: () => this.limpiarSesion(), // en caso de error igual limpiamos
    });
  }

  private limpiarSesion() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
