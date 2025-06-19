import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificacionService } from '../../services/notificacion.service';
import { notificacionUsuarioDto } from '../../models/notificacionDto';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, ButtonModule, BadgeModule, DialogModule],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.scss'
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);

  notificaciones: notificacionUsuarioDto[] = [];
  contadorNoLeidas: number = 0;
  mostrarDropdown: boolean = false;
  mostrarDialog: boolean = false;
  notificacionSeleccionada: notificacionUsuarioDto | null = null;

  constructor(
    private notificacionService: NotificacionService,
    private router: Router
  ) {}
  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.isAuthenticated$.subscribe((autenticado) => {
        if (autenticado) {
          this.subscribirNotificaciones();
        }
      })
    );
  }

  private subscribirNotificaciones(): void {
    this.subscriptions.add(
      this.notificacionService.notificaciones$.subscribe((notificaciones) => {
        this.notificaciones = notificaciones;
      })
    );

    this.subscriptions.add(
      this.notificacionService.contador$.subscribe((contador) => {
        this.contadorNoLeidas = contador;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleDropdown(): void {
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  cerrarDropdown(): void {
    this.mostrarDropdown = false;
  }

  marcarComoLeida(notificacion: notificacionUsuarioDto): void {
    this.notificacionSeleccionada = notificacion;
    
    // Verificar si es una invitación de chat
    if (this.esInvitacionChat(notificacion)) {
      this.abrirChat(notificacion);
      return;
    }
    
    this.mostrarDialog = true;
    this.cerrarDropdown();

    if (!notificacion.leido && notificacion.id) {
      this.notificacionService.marcarLeidaYActualizar(notificacion.id);
    }
  }

  /**
   * Verifica si una notificación es una invitación de chat
   */
  esInvitacionChat(notificacion: notificacionUsuarioDto): boolean {
    return notificacion.esMensajeChat === true && !!notificacion.chatId;
  }

  /**
   * Abre el chat cuando se hace clic en una invitación de chat
   */
  abrirChat(notificacion: notificacionUsuarioDto): void {
    if (!notificacion.chatId) {
      console.error('No se encontró el ID del chat en la notificación');
      return;
    }

    // Marcar la notificación como leída
    if (!notificacion.leido && notificacion.id) {
      this.notificacionService.marcarLeidaYActualizar(notificacion.id);
    }

    // Cerrar el dropdown
    this.cerrarDropdown();

    // Navegar al componente de chat con el chatId como parámetro
    this.router.navigate(['/chat', notificacion.chatId], {
      queryParams: {
        nombreOtroUsuario: this.extraerNombreOtroUsuario(notificacion)
      }
    });
  }

  /**
   * Extrae el nombre del otro usuario del título de la notificación
   */
  private extraerNombreOtroUsuario(notificacion: notificacionUsuarioDto): string {
    // El título tiene formato "Chat privado con [Nombre]"
    const match = notificacion.titulo.match(/Chat privado con (.+)/);
    return match ? match[1] : 'Usuario';
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
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas} h`;
    if (dias < 7) return `Hace ${dias} días`;
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
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
    return notificacion?.titulo || 'Sin título';
  }

  obtenerMensaje(notificacion: notificacionUsuarioDto): string {
    return notificacion?.mensaje || 'Sin mensaje';
  }

  obtenerFecha(notificacion: notificacionUsuarioDto): any {
    return notificacion?.fechaHora || null;
  }
}
