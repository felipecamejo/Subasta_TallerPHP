import {
  Component,
  Inject,
  AfterViewInit,
  PLATFORM_ID,
  Output,
  EventEmitter,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-google-login',
  template: `<div id="google-signin-btn"></div>`,
})
export class GoogleLoginComponent implements AfterViewInit {
  @Output() usuarioNoRegistrado = new EventEmitter<any>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private router: Router
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeGoogleSignIn();
    }
  }

  initializeGoogleSignIn(): void {
    if (!(window as any).google || !(window as any).google.accounts) {
      console.error('Google Identity Services no está cargado.');
      return;
    }

    (window as any).google.accounts.id.initialize({
      client_id:
        '1025980743929-r8catjhbvem2831ih98lnvu7vgbgqc6n.apps.googleusercontent.com',
      callback: (response: any) => {
        const idToken = response.credential;

        this.http
          this.http.post('http://localhost:8000/api/login-with-google', { token: idToken })
          .subscribe({
            next: (res: any) => {
              if (res.registrado) {
                localStorage.setItem('token', res.access_token);
                localStorage.setItem('usuario_id', res.usuario_id);
                localStorage.setItem('rol', res.rol);
                this.router.navigate(['/dashboard']);
              } else {
                // Emitir datos al componente padre (ej. register.component)
                this.usuarioNoRegistrado.emit({
                  nombre: res.nombre,
                  email: res.email,
                  imagen: res.imagen,
                });
              }
            },
            error: (err) => {
              console.error('Error al autenticar con Google:', err);
            },
          });
      },
    });

    (window as any).google.accounts.id.renderButton(
      document.getElementById('google-signin-btn'),
      {
        theme: 'outline',
        size: 'large',
      }
    );
  }
}