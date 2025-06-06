import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <h2>Iniciar sesión</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <label>Email:</label>
      <input formControlName="email" type="email" />
      <br />
      <label>Contraseña:</label>
      <input formControlName="password" type="password" />
      <br />
      <button type="submit">Entrar</button>
    </form>
    <br />
    <a routerLink="/registro">¿No tenés cuenta? Registrate</a>
  `
})
export class LoginComponent {
  form: FormGroup;

  constructor(private _formBuilder: FormBuilder) {
    this.form = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Login con', this.form.value);
    }
  }
}