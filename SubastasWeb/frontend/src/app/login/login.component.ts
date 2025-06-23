import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { GoogleLoginComponent } from '../google-login/google-login.component';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule, GoogleLoginComponent],
})
export class LoginComponent {
  form: FormGroup;
  error = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  login() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { email, password } = this.form.value;

    this.authService.loginTradicional(email, password).subscribe({
      next: (res: any) => {
        this.authService.login({
          token: res.token,
          rol: res.rol,
          usuario_id: res.usuario_id,
          usuario: res.usuario,
        });

        this.authService.redirigirPorRol(res.rol);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 403) {
          const email = this.form.get('email')?.value;
          localStorage.setItem('email_para_verificar', email);
          this.router.navigate(['/verificacion-pendiente']);
        } else {
          this.error = 'Email o contraseña incorrectos';
        }
      },
    });
  }

  get email() {
    return this.form.get('email');
  }

  get password() {
    return this.form.get('password');
  }
}
