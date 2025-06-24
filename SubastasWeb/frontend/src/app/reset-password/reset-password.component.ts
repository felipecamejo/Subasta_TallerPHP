import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PasswordService } from '../../services/PasswordService';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent {
  form: FormGroup;
  mensaje = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private passwordService: PasswordService
  ) {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    const email = this.route.snapshot.queryParamMap.get('email') || '';

    this.form = this.fb.group(
      {
        email: [email, [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        password_confirmation: ['', Validators.required],
        token: [token, Validators.required],
      },
      { validators: this.passwordsCoincidenValidator }
    );
  }

  enviar() {
    if (this.form.invalid) return;

    const data = this.form.value;

    this.passwordService.resetearContrasena(data).subscribe({
      next: () => {
        this.mensaje = 'Contraseña actualizada correctamente.';
        this.router.navigate(['/login']);
      },
      error: err => {
        console.error('Error desde backend:', err);
        this.mensaje = err.error?.message || 'Error al restablecer la contraseña';
      },
    });
  }

  // Validador de coincidencia de contraseñas
  passwordsCoincidenValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirm = group.get('password_confirmation')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  };

  // Getters para el template
  get password() {
    return this.form.get('password');
  }

  get password_confirmation() {
    return this.form.get('password_confirmation');
  }
}
