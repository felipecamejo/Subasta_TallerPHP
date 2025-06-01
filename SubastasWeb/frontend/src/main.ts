// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { SocialLoginModule, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';
import { GoogleLoginProvider } from '@abacritt/angularx-social-login';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),

    // ----- Agrega esto para Social Login -----
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,      // no iniciar sesión automáticamente
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '1025980743929-r8catjhbvem2831ih98lnvu7vgbgqc6n.apps.googleusercontent.com'
            )
          }
        ]
      } as SocialAuthServiceConfig,
    },
    SocialLoginModule, // registra el módulo de Social Login
    // --------------------------------------------
  ],
});
