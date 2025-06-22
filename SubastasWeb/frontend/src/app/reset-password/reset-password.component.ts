import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PasswordService } from '../../services/password.service'; // Servicio que ya tenés
import { ResetPasswordPayload } from './../../services/password.service';

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

    this.form = this.fb.group({
      email: [email, [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      password_confirmation: ['', [Validators.required]],
      token: [token, Validators.required],
    }, { validators: this.passwordsCoinciden });
  }

  passwordsCoinciden(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password')?.value;
    const confirm = control.get('password_confirmation')?.value;
    return password === confirm ? null : { noCoinciden: true };
  }

  enviar() {
    if (this.form.invalid) return;

    const data: ResetPasswordPayload = this.form.value;

    this.passwordService.resetPassword(data).subscribe({
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
}
