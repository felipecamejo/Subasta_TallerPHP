// src/app/services/notificacion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, of, map, Subscription } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { UrlService } from './url.service';
import { notificacionDto, notificacionUsuarioDto } from '../models/notificacionDto';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private baseUrl: string;
  private notificacionesSubject = new BehaviorSubject<notificacionUsuarioDto[]>([]);
  private contadorSubject = new BehaviorSubject<number>(0);
  private actualizacionAutomaticaInterval?: Subscription;

  public notificaciones$ = this.notificacionesSubject.asObservable();
  public contador$ = this.contadorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
    private authService: AuthService
  ) {
    this.baseUrl = this.urlService.baseUrl;

    this.authService.isAuthenticated$.subscribe((isAuth) => {
      if (isAuth) {
        this.iniciarActualizacionAutomatica();
        this.actualizarNotificaciones();
      } else {
        this.destruir();
      }
    });
  }

  private iniciarActualizacionAutomatica(): void {
    if (this.actualizacionAutomaticaInterval) {
      this.actualizacionAutomaticaInterval.unsubscribe();
    }

    this.actualizacionAutomaticaInterval = interval(30000).subscribe(() => {
      this.actualizarNotificaciones();
    });
  }

  actualizarNotificaciones(): void {
    const rol = this.authService.getRol();
    if (rol === 'admin') {
      this.destruir();
      return;
    }

    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) return;

    this.obtenerNotificaciones().subscribe({
      next: (notificaciones) => {
        this.notificacionesSubject.next(notificaciones);
        this.contadorSubject.next(this.contarNoLeidas(notificaciones));
      },
      error: (error) => {
        console.error('Error al obtener notificaciones:', error);
      }
    });
  }

  private enviarNotificacion(payload: any): Observable<notificacionDto> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    return this.http.post<notificacionDto>(`${this.baseUrl}/notificaciones`, payload, {
      headers: headers
    }).pipe(
      tap(response => {
        this.actualizarNotificaciones();
        return response;
      }),
      catchError(error => {
        console.error('Error al crear notificación:', error);
        throw error;
      })
    );
  }

  crearNotificacion(titulo: string, mensaje: string, idUsuarioDestino: number, chat: boolean, chatId: string): Observable<notificacionDto> {
    const notificacion = {
      titulo: titulo,
      mensaje: mensaje,
      usuarioIds: [idUsuarioDestino],
      esMensajeChat: chat,
      chatId: chatId
    };

    return this.enviarNotificacion(notificacion);
  }

  /**
   * Crea una notificación específica para invitaciones de chat
   */
  crearNotificacionChat(titulo: string, mensaje: string, idUsuarioDestino: number, chatId: string): Observable<notificacionDto> {
    const notificacion = {
      titulo: titulo,
      mensaje: mensaje,
      usuarioIds: [idUsuarioDestino],
      esMensajeChat: true,
      chatId: chatId
    };

    return this.enviarNotificacion(notificacion);
  }

  private obtenerNotificaciones(): Observable<notificacionUsuarioDto[]> {
    const usuarioId = localStorage.getItem('usuario_id');
    const rol = this.authService.getRol();
    
    // Para casas de remate, usar endpoint público
    if (rol === 'casa_remate' && usuarioId) {
      return this.obtenerNotificacionesPublico(Number(usuarioId));
    }
    // Para otros roles, usar endpoint con usuarioId
    if (usuarioId) {
      return this.http.get<any>(`${this.baseUrl}/notificaciones/${usuarioId}`).pipe(
        map(notificaciones => {
          if (Array.isArray(notificaciones)) {
            return notificaciones.map((notif: any) => ({
              id: notif.id,
              titulo: notif.titulo,
              mensaje: notif.mensaje,
              fechaHora: notif.fechaHora,
              leido: notif.leido,
              esMensajeChat: notif.esMensajeChat,
              chatId: notif.chatId,
              usuario: {
                id: notif.usuario?.id || null,
                nombre: notif.usuario?.nombre || null
              }
            }));
          }
          if (notificaciones && notificaciones.error) {
            console.warn('No se pudieron cargar notificaciones:', notificaciones.message || notificaciones.error);
          }
          return [];
        }),
        catchError(error => {
          if (error && error.error && error.error.message) {
            console.error('Error al obtener notificaciones:', error.error.message);
          } else {
            console.error('Error al obtener notificaciones:', error);
          }
          return of([]);
        })
      );
    }
    return of([]);
  }

  marcarLeidaYActualizar(id: number): void {
    this.http.put(`${this.baseUrl}/notificaciones/${id}/leer`, {}).subscribe({
      next: () => {
        const notificaciones = this.notificacionesSubject.value;
        const notificacion = notificaciones.find(n => n.id === id);
        if (notificacion) {
          notificacion.leido = true;
          this.notificacionesSubject.next(notificaciones);
          this.contadorSubject.next(this.contarNoLeidas(notificaciones));
        }
      },
      error: error => {
        console.error('Error al marcar notificación como leída:', error);
      }
    });
  }

  marcarTodasLeidasYActualizar(): void {
    this.http.put(`${this.baseUrl}/notificaciones/leer-todas`, {}).subscribe({
      next: () => {
        const notificaciones = this.notificacionesSubject.value;
        notificaciones.forEach(n => n.leido = true);
        this.notificacionesSubject.next(notificaciones);
        this.contadorSubject.next(0);
      },
      error: error => {
        console.error('Error al marcar todas las notificaciones como leídas:', error);
      }
    });
  }

  /**
   * Obtiene notificaciones para un usuario específico (endpoint público para pruebas)
   * @param usuarioId ID del usuario
   */
  obtenerNotificacionesPublico(usuarioId: number): Observable<notificacionUsuarioDto[]> {
    return this.http.get<notificacionUsuarioDto[]>(`${this.baseUrl}/test-notificaciones/${usuarioId}`, {
      headers: new HttpHeaders().set('Content-Type', 'application/json')
    }).pipe(
      catchError(error => {
        console.error('Error al obtener notificaciones públicas:', error);
        return of([]);
      })
    );
  }

  private contarNoLeidas(notificaciones: notificacionUsuarioDto[]): number {
    return notificaciones.filter(n => !n.leido).length;
  }

  /**
   * Manejar click en una notificación de chat
   */
  manejarClickNotificacionChat(notificacion: notificacionUsuarioDto): void {
    if (notificacion.esMensajeChat && notificacion.chatId) {
      // Marcar como leída primero
      this.marcarLeidaYActualizar(notificacion.id!);
      console.log('Notificación de chat marcada como leída');

      // Abrir el chat - esto debe ser manejado por el componente que usa el servicio
      console.log('Abrir chat:', notificacion.chatId);
    }
  }

  /**
   * Verificar si una notificación es de chat
   */
  esNotificacionDeChat(notificacion: notificacionUsuarioDto): boolean {
    return Boolean(notificacion.esMensajeChat && notificacion.chatId);
  }

  destruir(): void {
    if (this.actualizacionAutomaticaInterval) {
      this.actualizacionAutomaticaInterval.unsubscribe();
      this.actualizacionAutomaticaInterval = undefined;
    }
    this.notificacionesSubject.next([]);
    this.contadorSubject.next(0);
  }
}
