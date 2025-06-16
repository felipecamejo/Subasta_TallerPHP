// src/app/services/notificacion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    if (rol === 'admin' || rol === 'casa_remate') {
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

  private obtenerNotificaciones(): Observable<notificacionUsuarioDto[]> {
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

  private contarNoLeidas(notificaciones: notificacionUsuarioDto[]): number {
    return notificaciones.filter(n => !n.leido).length;
  }

  destruir(): void {
    if (this.actualizacionAutomaticaInterval) {
      this.actualizacionAutomaticaInterval.unsubscribe();
      this.actualizacionAutomaticaInterval = undefined;
    }
    this.notificacionesSubject.next([]);
    this.contadorSubject.next(0);
  }

  crearNotificacion(
    titulo: string,
    mensaje: string,
    idUsuarioDestino: number,
    chat: boolean,
    chatId: number | null
  ): Observable<notificacionDto> {
    const notificacion = {
      titulo,
      mensaje,
      usuarioIds: [idUsuarioDestino],
      esMensajeChat: chat,
      chatId
    };

    return this.http.post<notificacionDto>(`${this.baseUrl}/notificaciones`, notificacion).pipe(
      tap(() => this.actualizarNotificaciones()),
      catchError(error => {
        console.error('Error al crear notificación:', error);
        throw error;
      })
    );
  }
}
