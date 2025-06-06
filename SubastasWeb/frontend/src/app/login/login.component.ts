import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service'; // Ajustá si está en otra ruta

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <h2>Iniciar sesión</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <label>Email:</label>
      <input type="email" formControlName="email" />
      <br />

      <label>Contraseña:</label>
      <input type="password" formControlName="password" />
      <br />

      <button type="submit">Ingresar</button>
    </form>

    <br />
    <a routerLink="/register">¿No tenés cuenta? Registrate</a>
  `,
})
export class LoginComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const datos = this.form.value;
      console.log('Login con', datos);

      this.authService.login(datos).subscribe({
        next: (res) => {
          console.log('Login exitoso', res);

          // Guardar datos en localStorage
          localStorage.setItem('token', res.token);
          localStorage.setItem('usuario_id', res.usuario_id.toString());
          localStorage.setItem('usuario_rol', res.rol);

          alert('Bienvenido/a');

          // Opcional: redireccionar
          // this.router.navigate(['/inicio']);
        },
        error: (err) => {
          console.error('Error de login', err);
          alert('Credenciales inválidas');
        }
      });
    }
  }
}
