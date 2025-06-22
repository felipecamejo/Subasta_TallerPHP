import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from './../environments/environment';

export interface AuthData {
  token: string;
  rol: 'cliente' | 'rematador' | 'casa_remate' | 'admin' | string;
  usuario_id: number;
  usuario?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  login(authData: AuthData): void {
    localStorage.setItem('auth', JSON.stringify(authData));

    // Compatibilidad con código antiguo
    localStorage.setItem('token', authData.token);
    localStorage.setItem('rol', authData.rol);
    localStorage.setItem('usuario_id', authData.usuario_id.toString());

    this.isAuthenticatedSubject.next(true);
  }

  loginYRedirigir(authData: AuthData): void {
    this.login(authData);
    this.redirigirPorRol(authData.rol);
  }

  logout(): void {
    localStorage.removeItem('auth');
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('usuario_id');

    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.getAuthObject()?.token || null;
  }

  getRol(): string | null {
    return this.getAuthObject()?.rol || null;
  }

  getUsuarioId(): number | null {
    return this.getAuthObject()?.usuario_id || null;
  }

  getUsuario(): any | null {
    return this.getAuthObject()?.usuario || null;
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  redirigirPorRol(rol: string | undefined): void {
    switch (rol) {
      case 'cliente':
        this.router.navigate(['/dashboard-cliente']);
        break;
      case 'rematador':
        this.router.navigate(['/dashboard-rematador']);
        break;
      case 'casa_remate':
        this.router.navigate(['/dashboard-casa-remate']);
        break;
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      default:
        console.warn('Rol desconocido o no definido:', rol);
        this.router.navigate(['/']);
    }
  }

  private getAuthObject(): AuthData | null {
    try {
      const data = localStorage.getItem('auth');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private hasToken(): boolean {
    const auth = this.getAuthObject();
    return !!auth?.token;
  }

  loginTradicional(email: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/login`, {
      email,
      password
    });
  }
}
