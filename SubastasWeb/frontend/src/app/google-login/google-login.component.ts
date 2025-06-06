import { Component, OnInit, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

declare const google: any;

@Component({
  selector: 'app-google-login',
  standalone: true,
  imports: [],
  template: `<div id="googleButton"></div>`,
})
export class GoogleLoginComponent implements OnInit {
  @Output() usuarioNuevo = new EventEmitter<string>();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const esperarGoogle = () => {
      const buttonElement = document.getElementById('googleButton');

      if (typeof google === 'undefined' || !google.accounts?.id || !buttonElement) {
        setTimeout(esperarGoogle, 100);
        return;
      }

      google.accounts.id.initialize({
        client_id: '1025980743929-r8catjhbvem2831ih98lnvu7vgbgqc6n.apps.googleusercontent.com',
        callback: (response: any) => this.handleCredentialResponse(response),
      });

      google.accounts.id.renderButton(buttonElement, {
        theme: 'outline',
        size: 'large'
      });
    };

    esperarGoogle();
  }

  handleCredentialResponse(response: any) {
    const token = response.credential;

    this.http.post('http://localhost:8000/api/login-with-google', {
      token,
      rol: 'cliente' // Valor por defecto, el usuario nuevo completará luego
    }).subscribe({
      next: (res: any) => {
        console.log('✅ Usuario logueado con Google', res);
      },
      error: (err) => {
        if (err.status === 409) {
          console.warn('⚠️ Usuario nuevo, necesita completar datos');
          this.usuarioNuevo.emit(token); // emitimos el token al padre
        } else {
          console.error('❌ Error en login con Google', err);
        }
      }
    });
  }
}
