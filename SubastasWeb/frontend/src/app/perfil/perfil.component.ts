import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ActivatedRoute } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { RematadorService } from '../../services/rematador.service';
import { clienteDto } from '../../models/clienteDto';
import { rematadorDto } from '../../models/rematadorDto';
import { subastaDto } from '../../models/subastaDto';
import { RatingModule } from 'primeng/rating';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, TableModule, PaginatorModule, RatingModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  cliente?: clienteDto;
  rematador?: rematadorDto;
  private imagenPerfil: string = 'assets/img/default-avatar.png';
  private imagenCargada: boolean = false; // Flag para controlar que la imagen se cargue solo una vez
  estrellas: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private rematadorService: RematadorService,
    private fb: FormBuilder
  ) {
    // Inicializar el FormGroup para las estrellas
    this.estrellas = this.fb.group({
      value: [0]
    });
  }

  ngOnInit() {
    console.log('Iniciando componente de perfil');
    
    // Asegurarse de que la imagen predeterminada esté establecida al inicio
    if (!this.imagenCargada) {
      console.log('Configurando imagen predeterminada inicial');
      this.imagenPerfil = 'assets/img/default-avatar.png';
    }
    
    this.route.params.subscribe(params => {
      const usuario_id = +params['id'];
      console.log('Usuario ID:', usuario_id);
      
      if (!usuario_id || isNaN(usuario_id)) {
        console.error('ID de usuario inválido');
        return;
      }
      
      // Cargar datos del cliente
      this.clienteService.seleccionarCliente(usuario_id).subscribe({
        next: (data) => {
          console.log('Cliente data:', data);
          if (typeof data === 'string' || !data) {
            this.cliente = undefined;
            console.log('Cliente no encontrado');
          } else {
            this.cliente = data;
            console.log('Cliente cargado:', this.cliente);
            console.log('Información del usuario:', this.cliente?.usuario);
            console.log('Imagen del usuario:', this.cliente?.usuario?.imagen);
            this.actualizarImagenPerfil();
            
            // Actualizar estrellas si hay valoración del cliente
            if (this.cliente?.valoracion) {
              const promedio = this.obtenerPromedioValoracionCliente();
              this.estrellas.patchValue({ value: promedio });
            }
          }
        },
        error: (error) => {
          // Es normal que dé error si el usuario no es cliente
          console.log('No es un cliente:', error);
          this.cliente = undefined;
        },
        complete: () => {
          console.log('Completada petición de cliente');
        }
      });

      // Cargar datos del rematador
      this.rematadorService.seleccionarRematador(usuario_id).subscribe({
        next: (data) => {
          console.log('Rematador data:', data);
          if (typeof data === 'string' || !data) {
            this.rematador = undefined;
            console.log('Rematador no encontrado');
          } else {
            this.rematador = data;
            console.log('Rematador cargado:', this.rematador);
            console.log('Información del usuario:', this.rematador?.usuario);
            console.log('Imagen del usuario:', this.rematador?.usuario?.imagen);
            this.actualizarImagenPerfil();
          }
        },
        error: (error) => {
          // Es normal que dé error si el usuario no es rematador
          console.log('No es un rematador:', error);
          this.rematador = undefined;
        },
        complete: () => {
          console.log('Completada petición de rematador');
        }
      });
    });
  }

  // Eliminamos el arreglo de favoritos ya que no lo utilizamos

  obtenerPromedioValoracionCliente(): number {
    console.log('Valoración cliente:', this.cliente?.valoracion);
    if (!this.cliente?.valoracion || this.cliente.valoracion.cantidad_opiniones === 0) {
      console.log('No hay valoración disponible');
      return 0;
    }
    const valoracionTotal = this.cliente.valoracion.valoracion_total || 0;
    const cantidadOpiniones = this.cliente.valoracion.cantidad_opiniones || 1;
    const promedio = valoracionTotal / cantidadOpiniones;
    console.log(`Calculando promedio: ${valoracionTotal} / ${cantidadOpiniones} = ${promedio}`);
    
    // Usamos un redondeo más preciso (a una decimal)
    // y luego lo convertimos a entero para compatibilidad con el componente Rating
    return Math.round(promedio * 10) / 10;
  }

  /**
   * Obtener la URL de la imagen de perfil
   * Retorna la imagen del usuario si existe, o el avatar por defecto
   */
  getImageUrl(): string {
    // Simplemente devolvemos la propiedad almacenada
    return this.imagenPerfil;
  }
  
  /**
   * Actualiza la URL de la imagen de perfil solo la primera vez que se cargan datos
   * Esta función se llama cuando se obtienen datos del cliente o rematador
   */
  private actualizarImagenPerfil(): void {
    // Si ya se cargó una imagen, no hacer nada
    if (this.imagenCargada) {
      console.log('La imagen ya ha sido cargada, no se actualizará');
      return;
    }
    
    // Verificar si hay imagen de usuario disponible (cliente o rematador)
    const userImage = this.cliente?.usuario?.imagen || this.rematador?.usuario?.imagen;
    
    // Si hay imagen válida, actualizamos la propiedad
    if (userImage && userImage !== "" && userImage !== "null" && userImage !== "undefined") {
      console.log('Cargando imagen de usuario:', userImage);
      this.imagenPerfil = userImage;
    } else {
      console.log('Usando imagen predeterminada');
      this.imagenPerfil = 'assets/img/default-avatar.png';
    }
    
    // Marcar que la imagen ya se ha cargado para no volver a cambiarla
    this.imagenCargada = true;
  }
}

