import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importamos aquí los dos componentes que vamos a usar en la plantilla.
// - GoogleLoginComponent: ya lo tienes declarado tradicionalmente en AppModule.
// - RegisterComponent: lo configuramos como standalone (con CommonModule y ReactiveFormsModule).
import { GoogleLoginComponent } from './google-login/google-login.component';
import { RegisterComponent } from './register/register.component';

@Component({
  selector: 'app-root',
  // Lo marcamos standalone para poder importar directamente CommonModule y los componentes hijos.
  standalone: true,
  imports: [
    CommonModule,           // para *ngIf y demás directivas estructurales
    GoogleLoginComponent,   // para <app-google-login ...>
    RegisterComponent       // para <app-register ...>
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  mostrarFormularioExtra = false;

  // Aquí guardamos los datos que vienen del evento de GoogleLoginComponent
  datosParaForm: { nombre: string; email: string; imagen: string } | null = null;

  // Este método se dispara cuando GoogleLoginComponent emite usuarioNoRegistrado
  rellenarFormulario(datos: any) {
    this.datosParaForm = {
      nombre: datos.nombre,
      email: datos.email,
      imagen: datos.imagen
    };
    this.mostrarFormularioExtra = true;
  }
}