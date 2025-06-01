import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  form: FormGroup;
  googleProviderId = 'tu-client-id-google.apps.googleusercontent.com';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Formulario enviado:', this.form.value);
      // Aquí puedes agregar la lógica para enviar datos al backend
    }
  }

  onGoogleLogin(event: any) {
    console.log('Google login exitoso:', event);
    // Aquí puedes manejar el token recibido o lo que necesites tras el login
  }
}