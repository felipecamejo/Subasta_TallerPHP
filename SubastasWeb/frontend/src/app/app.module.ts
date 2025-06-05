import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';          // <— Asegúrate de que esté
import { ReactiveFormsModule } from '@angular/forms';    // <— Obligatorio para [formGroup]

import { SocialLoginModule, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';
import { GoogleLoginProvider } from '@abacritt/angularx-social-login';

import { AppComponent } from './app.component';
import { RegisterComponent } from './register/register.component';
import { GoogleLoginComponent } from './google-login/google-login.component';

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    GoogleLoginComponent
  ],
  imports: [
    BrowserModule,        // Incluye CommonModule internamente
    CommonModule,         // (opcional, pero no perjudica)
    ReactiveFormsModule,  // Necesario para formGroup, formControlName, Validators, etc.
    SocialLoginModule
  ],
  providers: [
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
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }