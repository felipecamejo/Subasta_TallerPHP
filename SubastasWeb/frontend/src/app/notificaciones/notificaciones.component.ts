import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { Subscription } from 'rxjs';
import { NotificacionService } from '../../services/notificacion.service';
import { notificacionUsuarioDto } from '../../models/notificacionDto';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    BadgeModule,
    DialogModule
  ],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.scss'
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  notificaciones: notificacionUsuarioDto[] = [];
  contadorNoLeidas: number = 0;
  mostrarDropdown: boolean = false;
  mostrarDialog: boolean = false;
  notificacionSeleccionada: notificacionUsuarioDto | null = null;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private notificacionService: NotificacionService
  ) {}

  ngOnInit(): void {
    if (this.estaAutenticado) {
      this.subscriptions.add(
        this.notificacionService.notificaciones$.subscribe((notificaciones: notificacionUsuarioDto[]) => {
          this.notificaciones = notificaciones;
        })
      );

      this.subscriptions.add(
        this.notificacionService.contador$.subscribe((contador: number) => {
          this.contadorNoLeidas = contador;
        })
      );

      this.notificacionService.inicializar();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get estaAutenticado(): boolean {
    return !!localStorage.getItem('usuario_id');
  }

  toggleDropdown(): void {
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  cerrarDropdown(): void {
    this.mostrarDropdown = false;
  }

  marcarComoLeida(notificacion: notificacionUsuarioDto): void {
    this.notificacionSeleccionada = notificacion;
    this.mostrarDialog = true;
    this.cerrarDropdown();
    
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

  formatearFechaCompleta(fechaHora: any): string {
    if (!fechaHora) return 'Sin fecha';
    
    const fecha = new Date(fechaHora);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  obtenerTitulo(notificacion: notificacionUsuarioDto): string {
    if (!notificacion) return 'Sin título';
    return notificacion.titulo || 'Sin título';
  }

  obtenerMensaje(notificacion: notificacionUsuarioDto): string {
    if (!notificacion) return 'Sin mensaje';
    return notificacion.mensaje || 'Sin mensaje';
  }

  obtenerFecha(notificacion: notificacionUsuarioDto): any {
    if (!notificacion) return null;
    return notificacion.fechaHora;
  }
}

