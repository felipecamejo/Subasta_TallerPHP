import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, ButtonModule, BadgeModule, DialogModule],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.scss'
})
export class NotificacionesComponent implements OnInit, OnDestroy {
 
  contadorNoLeidas: number = 0;
  mostrarDropdown: boolean = false;
  
  // Propiedades para el modal
  mostrarDialog: boolean = false;
  notificacionSeleccionada: NotificacionUsuarioDto | null = null;
    private subscriptions: Subscription = new Subscription();

  constructor(
    private notificacionService: NotificacionService,
    private securityService: SecurityService
  ) {}

  ngOnInit(): void {
    // Solo inicializar si el usuario está autenticado
    if (!this.securityService.isLoggedIn()) {
      return;
    }

    // Suscribirse a las notificaciones
    this.subscriptions.add(
      this.notificacionService.notificaciones$.subscribe((notificaciones: NotificacionUsuarioDto[]) => {
        this.notificaciones = notificaciones;
      })
    );

    // Suscribirse al contador
    this.subscriptions.add(
      this.notificacionService.contador$.subscribe((contador: number) => {
        this.contadorNoLeidas = contador;
      })
    );

    // Inicializar el servicio
    this.notificacionService.inicializar();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Verifica si el usuario está autenticado
   */
  get estaAutenticado(): boolean {
    return this.securityService.isLoggedIn();
  }

  toggleDropdown(): void {
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  cerrarDropdown(): void {
    this.mostrarDropdown = false;
  }

  marcarComoLeida(notificacion: NotificacionUsuarioDto): void {
    // Seleccionar la notificación para mostrar en el modal
    this.notificacionSeleccionada = notificacion;
    
    // Abrir el dialog
    this.mostrarDialog = true;
    
    // Cerrar el dropdown
    this.cerrarDropdown();
    
    // Marcar como leída si no está leída
    if (!notificacion.leido && notificacion.id) {
      this.notificacionService.marcarLeidaYActualizar(notificacion.id);
    }
  }

  marcarTodasComoLeidas(): void {
    this.notificacionService.marcarTodasLeidasYActualizar();
    this.cerrarDropdown();
  }

  cerrarDialog(): void {
    this.mostrarDialog = false;
    this.notificacionSeleccionada = null;
  }

  formatearFecha(fechaHora: any): string {
    if (!fechaHora) return '';
    
    const fecha = new Date(fechaHora);
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    if (minutos < 1) {
      return 'Ahora';
    } else if (minutos < 60) {
      return `Hace ${minutos} min`;
    } else if (horas < 24) {
      return `Hace ${horas} h`;
    } else if (dias < 7) {
      return `Hace ${dias} días`;
    } else {
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  }

  // Método para formatear fecha completa en el modal
  formatearFechaCompleta(fechaHora: any): string {
    if (!fechaHora) return 'Sin fecha';
    
    const fecha = new Date(fechaHora);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  // Método para obtener el título de la primera notificación
  obtenerTitulo(notificacionUsuario: NotificacionUsuarioDto): string {
    if (notificacionUsuario.notificaciones && notificacionUsuario.notificaciones.length > 0) {
      return notificacionUsuario.notificaciones[0].titulo || 'Sin título';
    }
    return 'Sin título';
  }

  // Método para obtener el mensaje de la primera notificación
  obtenerMensaje(notificacionUsuario: NotificacionUsuarioDto): string {
    if (notificacionUsuario.notificaciones && notificacionUsuario.notificaciones.length > 0) {
      return notificacionUsuario.notificaciones[0].mensaje || 'Sin mensaje';
    }
    return 'Sin mensaje';
  }

  // Método para obtener la fecha de la primera notificación
  obtenerFecha(notificacionUsuario: NotificacionUsuarioDto): any {
    if (notificacionUsuario.notificaciones && notificacionUsuario.notificaciones.length > 0) {
      return notificacionUsuario.notificaciones[0].fechaHora;
    }
    return null;
  }
}

