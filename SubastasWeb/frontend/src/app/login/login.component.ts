import { environment } from '../../environments/environment';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { GoogleLoginComponent } from '../google-login/google-login.component';
import { AuthService } from '../../services/auth.service'; 

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
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  login() {
    if (this.form.invalid) return;

    const datos = this.form.value;

    this.http.post(`${environment.apiUrl}/api/login`, datos).subscribe({
      next: (res: any) => {
        // Usamos el AuthService para guardar todo
        this.authService.login({
          token: res.token,
          usuario_id: res.usuario_id,
          rol: res.rol,
          usuario: res.usuario
        });

        // Redirigir siempre al buscador de remates, independientemente del rol
        this.router.navigate(['/buscadorRemates']);
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
