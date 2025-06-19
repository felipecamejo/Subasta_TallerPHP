import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  login(authData: {
    token: string,
    rol: string,
    usuario_id: number,
    usuario: any
  }): void {
    // Nuevo formato unificado
    localStorage.setItem('auth', JSON.stringify(authData));

    // Compatibilidad con código viejo
    localStorage.setItem('token', authData.token);
    localStorage.setItem('rol', authData.rol);
    localStorage.setItem('usuario_id', authData.usuario_id.toString());

    this.isAuthenticatedSubject.next(true);
  }

  logout(): void {
    localStorage.removeItem('auth');

    // Limpieza de claves separadas (opcional, podés dejarlo si querés 100% compatibilidad)
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('usuario_id');

    this.isAuthenticatedSubject.next(false);
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

  private getAuthObject(): any {
    return JSON.parse(localStorage.getItem('auth') || '{}');
  }

  private hasToken(): boolean {
    const auth = this.getAuthObject();
    return !!auth.token || !!localStorage.getItem('token');
  }
}
