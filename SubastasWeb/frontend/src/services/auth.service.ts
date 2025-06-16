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
    this.verificarAutenticacion(); // Verifica el token al iniciar
  }

  /**
   * Guarda los datos completos del usuario en localStorage.
   * Se espera un objeto con: token, usuario_id, rol y usuario.
   */
  login(data: {
    token: string;
    usuario_id: number;
    rol: string;
    usuario: any;
  }): void {
    localStorage.setItem('auth', JSON.stringify(data));
    this.authSubject.next(true);
  }

  logout(): void {
    localStorage.clear();
    this.authSubject.next(false);
  }

  /** Devuelve todo el objeto auth del localStorage */
  getAuthData(): any {
    const raw = localStorage.getItem('auth');
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.token && parsed?.usuario_id && parsed?.rol) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return this.getAuthData()?.token ?? null;
  }

  getUsuarioId(): string | null {
    return this.getAuthData()?.usuario_id ?? null;
  }

  getRol(): string | null {
    return this.getAuthData()?.rol ?? null;
  }

  getUsuario(): any {
    return this.getAuthData()?.usuario ?? null;
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
