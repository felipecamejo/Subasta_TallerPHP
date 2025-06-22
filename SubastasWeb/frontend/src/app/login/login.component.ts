import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
})
export class LoginComponent {
  form: FormGroup;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { email, password } = this.form.value;

    this.authService.loginTradicional(email, password).subscribe({
      next: (res: any) => {
        this.authService.loginYRedirigir(res);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.message || 'Error inesperado al iniciar sesión';
        alert(this.errorMessage);
      }
    });
  }

  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
}
