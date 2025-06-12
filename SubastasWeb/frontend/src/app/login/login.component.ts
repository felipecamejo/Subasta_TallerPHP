import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { GoogleLoginComponent } from '../google-login/google-login.component';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, GoogleLoginComponent, RouterModule],
})
export class LoginComponent {
  form: FormGroup;
  error: string = '';
  mostrarFormulario: boolean = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  login() {
    if (this.form.invalid) return;

    const datos = this.form.value;

    this.http.post('http://localhost:8000/api/login', datos).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario_id', res.usuario_id);
        localStorage.setItem('rol', res.rol);

        if (res.rol === 'cliente') {
          this.router.navigate(['/dashboard-cliente']);
        } else if (res.rol === 'rematador') {
          this.router.navigate(['/dashboard-rematador']);
        }
      },
      error: (err) => {
        if (err.status === 403) {
          this.router.navigate(['/verificacion-pendiente'], {
            queryParams: { email: this.form.get('email')?.value }
          });
        } else {
          this.error = 'Email o contraseña incorrectos';
        }
      },
    });
  }

  mostrarFormularioRegistro(usuarioGoogle: any) {
    this.router.navigate(['/registro'], { state: { usuarioGoogle } });
  }
}
