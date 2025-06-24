import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PasswordService } from '../../services/PasswordService';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  form: FormGroup;
  mensaje = '';

  constructor(private fb: FormBuilder, private passwordService: PasswordService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  enviar() {
    if (this.form.invalid) return;

    const email = this.form.get('email')?.value;

    this.passwordService.enviarResetPassword(email).subscribe({
      next: (res: any) => {
        this.mensaje = res.message;
      },
      error: err => {
        this.mensaje = err.error?.error || 'Error al enviar correo';
      },
    });
  }
}