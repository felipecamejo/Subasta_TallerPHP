import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ActivatedRoute } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { RematadorService } from '../../services/rematador.service';
import { AuthService } from '../../services/auth.service';
import { clienteDto } from '../../models/clienteDto';
import { rematadorDto } from '../../models/rematadorDto';
import { subastaDto } from '../../models/subastaDto';
import { RatingModule } from 'primeng/rating';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PerfilEditarModalComponent } from '../perfil-editar-modal/perfil-editar-modal.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, TableModule, PaginatorModule, ButtonModule, TooltipModule, RatingModule, ReactiveFormsModule, PerfilEditarModalComponent],
  providers: [DatePipe],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  cliente?: clienteDto;
  rematador?: rematadorDto;
  private imagenPerfil: string = 'assets/img/default.jpg';
  private imagenCargada: boolean = false; // Flag para controlar que la imagen se cargue solo una vez
  estrellas: FormGroup;
  
  // Nuevas propiedades para el manejo del perfil
  isOwnProfile: boolean = false; // Indica si es el perfil del usuario logueado
  currentUserId: number | null = null;
  profileUserId: number | null = null;
  
  // Nueva propiedad para la ubicación legible
  ubicacionNombre: string = 'No especificada';
  cargandoUbicacion: boolean = false;
  
  // Propiedad para controlar el modal de edición
  mostrarModalEdicion: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private rematadorService: RematadorService,
    private authService: AuthService,
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
      this.imagenPerfil = 'assets/img/default.jpg';
    }
    
    this.route.params.subscribe(params => {
      const usuario_id = +params['id'];
      console.log('Usuario ID:', usuario_id);
      
      if (!usuario_id || isNaN(usuario_id)) {
        console.error('ID de usuario inválido');
        return;
      }
      
      // Verificar si es el perfil del usuario logueado
      this.profileUserId = usuario_id;
      this.currentUserId = this.authService.getUsuarioId();
      this.isOwnProfile = this.currentUserId === usuario_id;
      
      // Cargar datos del usuario
      this.cargarDatosUsuario(usuario_id);
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
      // Si la imagen es una ruta relativa, construir la URL completa
      if (userImage.startsWith('/uploads/')) {
        this.imagenPerfil = 'http://localhost:8000' + userImage;
      } else if (userImage.startsWith('data:image/')) {
        // Si es Base64, usarla directamente
        this.imagenPerfil = userImage;
      } else {
        // Si es una URL completa, usarla directamente
        this.imagenPerfil = userImage;
      }
    } else {
      console.log('Usando imagen predeterminada');
      this.imagenPerfil = 'assets/img/default.jpg';
    }
    
    // Marcar que la imagen ya se ha cargado para no volver a cambiarla
    this.imagenCargada = true;
  }

  abrirModalEditarPerfil(): void {
    console.log('Abriendo modal de edición de perfil');
    this.mostrarModalEdicion = true;
  }

  /**
   * Maneja el evento cuando se actualiza el perfil desde el modal
   */
  onPerfilActualizado(): void {
    console.log('Perfil actualizado, recargando datos...');
    // Recargar los datos del perfil
    const usuarioId = this.currentUserId;
    if (usuarioId) {
      this.cargarDatosUsuario(usuarioId);
    }
  }

  /**
   * Maneja el evento cuando se actualiza la imagen desde el modal
   */
  onImagenActualizada(nuevaImagenUrl: string): void {
    console.log('Imagen actualizada:', nuevaImagenUrl);
    this.cambiarImagenPerfil(nuevaImagenUrl);
  }

  /**
   * Carga los datos del usuario (cliente o rematador)
   */
  private cargarDatosUsuario(usuarioId: number): void {
    let clienteCargado = false;
    let rematadorCargado = false;
    
    // Cargar datos del cliente
    this.clienteService.seleccionarCliente(usuarioId).subscribe({
      next: (data) => {
        clienteCargado = true;
        if (typeof data === 'string' || !data) {
          this.cliente = undefined;
        } else {
          this.cliente = data;
          this.actualizarImagenPerfil();
          this.obtenerUbicacionLegible();
          
          if (this.cliente?.valoracion) {
            const promedio = this.obtenerPromedioValoracionCliente();
            this.estrellas.patchValue({ value: promedio });
          }
        }
        
        // Solo cargar rematador si no es cliente
        if (!this.cliente) {
          this.cargarDatosRematador(usuarioId);
        }
      },
      error: (error) => {
        console.log('Usuario no es cliente, intentando cargar como rematador');
        this.cliente = undefined;
        clienteCargado = true;
        
        // Solo cargar rematador si falló como cliente
        this.cargarDatosRematador(usuarioId);
      }
    });
  }

  /**
   * Carga específicamente los datos del rematador
   */
  private cargarDatosRematador(usuarioId: number): void {
    this.rematadorService.seleccionarRematador(usuarioId).subscribe({
      next: (data) => {
        if (typeof data === 'string' || !data) {
          this.rematador = undefined;
        } else {
          this.rematador = data;
          this.actualizarImagenPerfil();
          this.obtenerUbicacionLegible();
        }
      },
      error: (error) => {
        console.log('Usuario no es rematador tampoco');
        this.rematador = undefined;
      }
    });
  }

  /**
   * Actualiza la imagen de perfil cuando el usuario selecciona una nueva
   * Este método será llamado desde el modal de edición
   */
  cambiarImagenPerfil(nuevaImagenUrl: string): void {
    console.log('Actualizando imagen de perfil a:', nuevaImagenUrl);
    
    // Validar que la nueva URL no esté vacía
    if (nuevaImagenUrl && nuevaImagenUrl.trim() !== '') {
      // Si la imagen es una ruta relativa, construir la URL completa
      if (nuevaImagenUrl.startsWith('/uploads/')) {
        this.imagenPerfil = 'http://localhost:8000' + nuevaImagenUrl;
      } else if (nuevaImagenUrl.startsWith('data:image/')) {
        // Si es Base64, usarla directamente
        this.imagenPerfil = nuevaImagenUrl;
      } else {
        // Si es una URL completa, usarla directamente
        this.imagenPerfil = nuevaImagenUrl;
      }
      this.imagenCargada = true;
    } else {
      // Si no hay imagen, usar la por defecto
      this.imagenPerfil = 'assets/img/default.jpg';
      this.imagenCargada = true;
    }
  }

  /**
   * Resetea la imagen a la por defecto
   * Útil si el usuario quiere quitar su imagen personalizada
   */
  resetearImagenPerfil(): void {
    console.log('Reseteando imagen de perfil a la por defecto');
    this.imagenPerfil = 'assets/img/default.jpg';
    this.imagenCargada = true;
  }

  formatearTelefono(telefono: string): string {
    // Formatear el teléfono de manera más legible
    if (!telefono) return 'No especificado';
    return telefono.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  formatearCedula(cedula: string): string {
    // Formatear la cédula de manera más legible
    if (!cedula) return 'No especificada';
    return cedula.replace(/(\d{1,2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
  }

  /**
   * Obtiene la ubicación legible usando geocodificación inversa
   */
  obtenerUbicacionLegible(): void {
    const lat = this.cliente?.usuario?.latitud || this.rematador?.usuario?.latitud;
    const lng = this.cliente?.usuario?.longitud || this.rematador?.usuario?.longitud;
    
    // Si no hay coordenadas, no hacer nada
    if (!lat || !lng || lat === 0 || lng === 0) {
      this.ubicacionNombre = 'No especificada';
      return;
    }
    
    this.cargandoUbicacion = true;
    
    // Usar el servicio de geocodificación inversa de OpenStreetMap (Nominatim)
    // Es gratuito y no requiere API key
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log('Respuesta de geocodificación:', data);
        
        if (data && data.display_name) {
          // Extraer información relevante del resultado
          const address = data.address;
          let ubicacion = '';
          
          if (address) {
            // Construir una dirección más legible
            const partes = [];
            
            if (address.city || address.town || address.village) {
              partes.push(address.city || address.town || address.village);
            }
            
            if (address.state) {
              partes.push(address.state);
            }
            
            if (address.country) {
              partes.push(address.country);
            }
            
            ubicacion = partes.join(', ');
          }
          
          // Si no se pudo construir una ubicación desde las partes, usar display_name
          if (!ubicacion) {
            // Tomar solo las primeras 3 partes del display_name para que no sea muy largo
            const partes = data.display_name.split(',').slice(0, 3);
            ubicacion = partes.join(',').trim();
          }
          
          this.ubicacionNombre = ubicacion || 'Ubicación encontrada';
        } else {
          this.ubicacionNombre = 'Ubicación no encontrada';
        }
      })
      .catch(error => {
        console.error('Error al obtener ubicación:', error);
        this.ubicacionNombre = 'Error al obtener ubicación';
      })
      .finally(() => {
        this.cargandoUbicacion = false;
      });
  }

  /**
   * Obtiene la ubicación para mostrar en el perfil
   */
  getUbicacion(): string {
    if (this.cargandoUbicacion) {
      return 'Cargando ubicación...';
    }
    return this.ubicacionNombre;
  }
}

