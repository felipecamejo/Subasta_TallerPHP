import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

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

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  enviar() {
    if (this.form.invalid) return;

    this.http.post('http://localhost:8000/api/forgot-password', this.form.value).subscribe({
      next: (res: any) => {
        this.mensaje = res.message;
      },
      error: err => {
        this.mensaje = err.error?.error || 'Error al enviar correo';
      },
    });
  }
}
