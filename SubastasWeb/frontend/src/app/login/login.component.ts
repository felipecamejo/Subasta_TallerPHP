import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { GoogleLoginComponent } from '../google-login/google-login.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, GoogleLoginComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  form: FormGroup;
  mostrarFormulario = false;
  datosExtras = {
    rol: 'cliente',
    matricula: '',
    token: ''
  };

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Login tradicional:', this.form.value);
      // llamada a tu backend para login tradicional
    }
  }

  mostrarFormularioRegistro(token: string) {
    this.mostrarFormulario = true;
    this.datosExtras.token = token;
  }

  enviarRegistroConGoogle() {
    this.http.post('http://localhost:8000/api/login-with-google', this.datosExtras)
      .subscribe({
        next: res => {
          console.log('✅ Registro completo con Google', res);
        },
        error: err => {
          console.error('❌ Error al registrar con Google', err);
        }
      });
  }
}
