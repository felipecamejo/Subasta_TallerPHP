import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

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
    private http: HttpClient,
    private router: Router
  ) {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    const email = this.route.snapshot.queryParamMap.get('email') || '';

    this.form = this.fb.group({
      email: [email, [Validators.required, Validators.email]],
      password: ['', Validators.required],
      password_confirmation: ['', Validators.required],
      token: [token, Validators.required],
    });
  }

enviar() {
  if (this.form.invalid) return;

  // Mostrá lo que se está enviando
  console.log('Datos enviados al backend:', this.form.value);

  this.http.post('http://localhost:8000/api/reset-password', this.form.value).subscribe({
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
