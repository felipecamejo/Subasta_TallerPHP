import { Component, Inject, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-google-login',
  template: `<div id="google-signin-btn"></div>`,
})
export class GoogleLoginComponent implements AfterViewInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeGoogleSignIn();
    }
  }

  initializeGoogleSignIn(): void {
    // Asegurarse que la librería esté cargada
    if (!(window as any).google || !(window as any).google.accounts) {
      console.error('Google Identity Services no está cargado.');
      return;
    }

    (window as any).google.accounts.id.initialize({
      client_id: '1025980743929-r8catjhbvem2831ih98lnvu7vgbgqc6n.apps.googleusercontent.com',
      callback: (response: any) => {
        console.log('Token de Google:', response.credential);
        // Aquí podés enviar el token a tu backend para autenticar
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
