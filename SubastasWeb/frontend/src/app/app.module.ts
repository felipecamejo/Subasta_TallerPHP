import { environment } from './../environments/environment'; 
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-registro-google',
  templateUrl: './registro-google.component.html',
  styleUrls: ['./registro-google.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class RegistroGoogleComponent implements OnInit {

  form!: FormGroup;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    console.log('🧪 ngOnInit ejecutado');

    this.form = new FormGroup({
      nombre: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      cedula: new FormControl('', Validators.required),
      telefono: new FormControl('', Validators.required),

      contrasenia: new FormControl('', [Validators.required, Validators.minLength(8)]),
      contrasenia_confirmation: new FormControl('', Validators.required),

      rol: new FormControl('', Validators.required),
      idFiscal: new FormControl(''),

      latitud: new FormControl(null, Validators.required),
      longitud: new FormControl(null, Validators.required),

      google_id: new FormControl('', Validators.required),
    }, { validators: this.matchPasswords });
  }

  matchPasswords(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('contrasenia')?.value;
    const confirm = group.get('contrasenia_confirmation')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  onRolChange() {
    const rol = this.form.get('rol')?.value;
    const idFiscal = this.form.get('idFiscal');

    if (rol === 'casa_remate') {
      idFiscal?.setValidators([Validators.required]);
    } else {
      idFiscal?.clearValidators();
    }

    idFiscal?.updateValueAndValidity();
  }

  enviar() {
    console.log(' enviar() ejecutado');

    if (this.form.invalid) {
      console.log(' Formulario inválido');
      Object.entries(this.form.controls).forEach(([key, control]) => {
        if (control.invalid) {
          console.warn(`Campo inválido: ${key}`, control.errors);
        }
      });
      return;
    }

    const payload = this.form.getRawValue();
    console.log(' Payload que se envía:', payload);

    const url = payload.rol === 'casa_remate'
  ? `${environment.apiUrl}/api/register-google-casa-remate`
  : `${environment.apiUrl}/api/register-google-user`;

    this.http.post(url, payload).subscribe({
      next: (res: any) => {
        console.log(' Registro exitoso', res);
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('usuario_id', res.usuario_id);
        localStorage.setItem('rol', res.rol);

        if (res.rol === 'cliente') this.router.navigate(['/dashboard-cliente']);
        else if (res.rol === 'rematador') this.router.navigate(['/dashboard-rematador']);
        else if (res.rol === 'casa_remate') this.router.navigate(['/dashboard-casa-remate']);
      },
      error: err => {
        console.error(' Error al registrar con Google:', err);
        alert('Error: ' + JSON.stringify(err.error.details || err.error));
      }
    });
  }
}
