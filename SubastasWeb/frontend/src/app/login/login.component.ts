import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <form [formGroup]="form" (ngSubmit)="onSubmit()">
    <label>Email:</label>
    <input formControlName="email" type="email" />
    <div *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
      <small *ngIf="form.get('email')?.errors?.['required']">Email es requerido</small>
      <small *ngIf="form.get('email')?.errors?.['email']">Email inválido</small>
    </div>

    <label>Contraseña:</label>
    <input formControlName="password" type="password" />
    <div *ngIf="form.get('password')?.invalid && form.get('password')?.touched">
      <small *ngIf="form.get('password')?.errors?.['required']">Contraseña requerida</small>
    </div>

    <button type="submit" [disabled]="form.invalid">Ingresar</button>
  </form>
  `
})
export class LoginComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    console.log('Enviando login:', this.form.value);

    this.http.post<any>('http://localhost:8000/api/login', this.form.value).subscribe({
      next: (res) => {
        console.log('Respuesta backend:', res);
        // Aquí puedes guardar token, id, rol, etc en localStorage
      },
      error: (err) => {
        console.error('Error login:', err);
      }
    });
  }
}