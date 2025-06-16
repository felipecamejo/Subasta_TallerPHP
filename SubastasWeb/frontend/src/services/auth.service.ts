import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.authSubject.asObservable();

  constructor(private http: HttpClient) {
    this.verificarAutenticacion(); // Al iniciar, valida si hay token
  }

  login(token: string, email: string, usuario_id: string, rol: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    localStorage.setItem('usuario_id', usuario_id);
    localStorage.setItem('rol', rol); // ✅ Guardar el rol, sea cliente, rematador, casa_remate o admin
    this.verificarAutenticacion();
  }

  logout(): void {
    localStorage.clear();
    this.authSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUsuarioId(): string | null {
    return localStorage.getItem('usuario_id');
  }

  getRol(): string | null {
    return localStorage.getItem('rol');
  }

  isAuthenticated(): boolean {
    return this.authSubject.value;
  }

  verificarAutenticacion(): void {
    const token = this.getToken();
    if (!token) {
      this.authSubject.next(false);
      return;
    }

    this.http.get('http://localhost:8000/api/check-auth').subscribe({
      next: () => this.authSubject.next(true),
      error: () => this.logout()
    });
  }
}
