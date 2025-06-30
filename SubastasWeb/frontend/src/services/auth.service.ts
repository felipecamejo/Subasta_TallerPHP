import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from './../environments/environment';
import { RegistroGoogleDto } from './../models/registro-google.dto';

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
  private authSubject = new BehaviorSubject<AuthData | null>(this.getAuthObject());
  public auth$ = this.authSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private usuarioSubject = new BehaviorSubject<any | null>(this.getAuthObject()?.usuario ?? null);
  public usuario$ = this.usuarioSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(authData: AuthData): void {
    localStorage.setItem('auth', JSON.stringify(authData));
    this.authSubject.next(authData);
    this.usuarioSubject.next(authData.usuario ?? null);
    this.isAuthenticatedSubject.next(true);
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
    this.authSubject.next(null);
    this.usuarioSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  loginTradicional(email: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/login`, { email, password });
  }

  getToken(): string | null {
    return this.getAuthObject()?.token ?? null;
  }

  getRol(): string | null {
    return this.getAuthObject()?.rol ?? null;
  }

  getUsuarioId(): number | null {
    return this.getAuthObject()?.usuario_id ?? null;
  }

  getUsuario(): any | null {
    return this.getAuthObject()?.usuario ?? null;
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  reenviarVerificacionEmail(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/email/resend`, { email });
  }

  obtenerDatosAutenticado(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/usuario-autenticado`);
  }

  registerUsuario(formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/register`, formData);
  }

  registerCasaRemate(formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/register-casa-remate`, formData);
  }

  registrarConGoogle(data: RegistroGoogleDto): Observable<any> {
    const url = data.rol === 'casa_remate'
      ? `${environment.apiUrl}/api/register-google-casa-remate`
      : `${environment.apiUrl}/api/register-google-user`;

    const payload = {
      ...(data.rol !== 'rematador' && { matricula: undefined }),
      ...(data.rol !== 'casa_remate' && { idFiscal: undefined }),
      ...(data.rol === 'casa_remate' && { cedula: null }),
      ...data
    };

    if (payload.cedula === '') payload.cedula = null;

    return this.http.post(url, payload);
  }

  // Helpers

  private getAuthObject(): AuthData | null {
    try {
      const data = localStorage.getItem('auth');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private hasToken(): boolean {
    return !!this.getAuthObject()?.token;
  }
}
