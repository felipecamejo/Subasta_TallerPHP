import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
 ) {}

 login(authData: AuthData): void {

    localStorage.setItem('auth', JSON.stringify(authData));
    localStorage.setItem('token', authData.token);
    localStorage.setItem('rol', authData.rol);
    localStorage.setItem('usuario_id', authData.usuario_id.toString());
    this.isAuthenticatedSubject.next(true); // Cambia el estado de autenticación
}

  loginYRedirigir(authData: AuthData): void {
    this.login(authData);
    this.redirigirPorRol(authData.rol);
  }

  
redirigirPorRol(rol: string | undefined): void {
  switch (rol) {
    case 'admin':
      this.router.navigate(['/admin']);
      break;
    case 'cliente':
    case 'rematador':
    case 'casa_remate':
    default:
      this.router.navigate(['/buscadorRemates']); 
      break;
  }
}

  logout(): void {
    localStorage.removeItem('auth');
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('usuario_id');
    this.isAuthenticatedSubject.next(false); // Cambia el estado de autenticación
    this.router.navigate(['/login']);
  }

  loginTradicional(email: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/login`, { email, password });
  }

  getToken(): string | null {
    const auth = this.getAuthObject();
    return auth?.token || localStorage.getItem('token');
  }

  getRol(): string | null {
    const auth = this.getAuthObject();
    return auth?.rol || localStorage.getItem('rol');
  }

  getUsuarioId(): number | null {
    const auth = this.getAuthObject();
    return auth?.usuario_id || Number(localStorage.getItem('usuario_id'));
  }

  getUsuario(): any | null {
    return this.getAuthObject()?.usuario || null;
  }

  isLoggedIn(): boolean {
    return this.hasToken();
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
    return !!auth?.token || !!localStorage.getItem('token');
  }

  reenviarVerificacionEmail(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/email/resend`, { email });
  }

  obtenerDatosAutenticado(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/usuario-autenticado`);
  }
}
