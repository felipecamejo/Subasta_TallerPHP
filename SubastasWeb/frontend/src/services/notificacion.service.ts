import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, of, map } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { UrlService } from './url.service';
import { notificacionDto, notificacionUsuarioDto } from '../models/notificacionDto';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private baseUrl: string;
  private notificacionesSubject = new BehaviorSubject<notificacionUsuarioDto[]>([]);
  private contadorSubject = new BehaviorSubject<number>(0);
  private actualizacionAutomaticaInterval: any;

  public notificaciones$ = this.notificacionesSubject.asObservable();
  public contador$ = this.contadorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private urlService: UrlService
  ) {
    this.baseUrl = this.urlService.baseUrl;
    this.iniciarActualizacionAutomatica();
  }

  private iniciarActualizacionAutomatica(): void {
    this.actualizacionAutomaticaInterval = interval(30000).subscribe(() => {
      this.actualizarNotificaciones();
    });
  }

  inicializar(): void {
    this.actualizarNotificaciones();
  }

  private actualizarNotificaciones(): void {
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
    return this.http.post<notificacionDto>(`${this.baseUrl}/notificaciones`, payload).pipe(
      tap(() => this.actualizarNotificaciones()),
      catchError(error => {
        console.error('Error al crear notificación:', error);
        throw error;
      })
    );
  }

  crearNotificacion(titulo: string, mensaje: string, idUsuarioDestino: number, chat: boolean, chatId: Number): Observable<notificacionDto> {
    const notificacion = {
      titulo,
      mensaje,
      usuarioIds: [idUsuarioDestino],
      esMensajeChat: chat,
      chatId
    };
    return this.enviarNotificacion(notificacion);
  }

  private obtenerNotificaciones(): Observable<notificacionUsuarioDto[]> {
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) {
      return of([]); // Usuario no logueado
    }

    return this.http.get<any>(`${this.baseUrl}/notificaciones`).pipe(
      map(notificaciones => {
        if (Array.isArray(notificaciones)) {
          return notificaciones.map((notif: any) => ({
            id: notif.id,
            titulo: notif.titulo,
            mensaje: notif.mensaje,
            fechaHora: notif.fechaHora,
            leido: notif.leido,
            usuario: {
              id: notif.usuario?.id || null,
              nombre: notif.usuario?.nombre || null
            }
          }));
        }
        return [];
      }),
      catchError(error => {
        console.error('Error al obtener notificaciones:', error);
        return of([]);
      })
    );
  }

  marcarLeidaYActualizar(id: number): void {
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) return;

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
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) return;

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

  private contarNoLeidas(notificaciones: notificacionUsuarioDto[]): number {
    return notificaciones.filter(n => !n.leido).length;
  }

  destruir(): void {
    if (this.actualizacionAutomaticaInterval) {
      this.actualizacionAutomaticaInterval.unsubscribe();
    }
  }
}
