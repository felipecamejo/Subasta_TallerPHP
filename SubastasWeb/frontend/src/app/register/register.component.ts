// src/app/register/register.component.ts
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <h2>Registro</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <label>Nombre:</label>
      <input formControlName="nombre" type="text" />
      <br />
      <label>Email:</label>
      <input formControlName="email" type="email" />
      <br />
      <label>Contraseña:</label>
      <input formControlName="password" type="password" />
      <br />
      <label>Tipo:</label>
      <select formControlName="tipo">
        <option value="cliente">Cliente</option>
        <option value="rematador">Rematador</option>
      </select>
      <br />
      <div *ngIf="form.get('tipo')?.value === 'rematador'">
        <label>Matrícula:</label>
        <input formControlName="matricula" type="text" />
      </div>
      <button type="submit">Registrarse</button>
    </form>
    <br />
    <a routerLink="/login">¿Ya tenés cuenta? Iniciar sesión</a>
  `
})
export class RegisterComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      tipo: ['cliente'],
      matricula: ['']
    });
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Registro con', this.form.value);
    }
  }
}
