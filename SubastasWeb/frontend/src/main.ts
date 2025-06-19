// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app/app.routes';
import {
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi
} from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './app/interceptors/auth.interceptor';

import {
  SocialAuthServiceConfig,
  GoogleLoginProvider,
  SocialAuthService
} from '@abacritt/angularx-social-login';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi() // ✅ ahora inyecta desde los providers
    ),
    {
      provide: HTTP_INTERCEPTORS, // ✅ Registro del interceptor como clase
      useClass: AuthInterceptor,
      multi: true
    },
    provideAnimationsAsync(),
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
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
    SocialAuthService,
  ],
});
