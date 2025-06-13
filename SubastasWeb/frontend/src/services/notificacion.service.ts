import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  private headers: HttpHeaders;

  public notificaciones$ = this.notificacionesSubject.asObservable();
  public contador$ = this.contadorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private urlService: UrlService
  ) {
    this.baseUrl = this.urlService.baseUrl;
    // Add Authorization header if token exists
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    this.headers = headers;
    this.iniciarActualizacionAutomatica();
  }

  private iniciarActualizacionAutomatica(): void {
    this.actualizacionAutomaticaInterval = interval(30000).subscribe(() => {
      this.actualizarNotificaciones();
    });
  }

  /**
   * Inicializa el servicio cargando las notificaciones
   */
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

  crearNotificacion(titulo: string, mensaje: string, idUsuarioDestino: number, chat: boolean, chatId: Number): Observable<notificacionDto> {
    const notificacion = {
      titulo: titulo,
      mensaje: mensaje,
      usuarioIds: [idUsuarioDestino],
      esMensajeChat: chat,
      chatId: chatId
    };

    return this.enviarNotificacion(notificacion);
  }

  private obtenerNotificaciones(): Observable<notificacionUsuarioDto[]> {
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) {
      return of([]); // Si no hay usuario, devolvemos un array vacío
    }

    const token = localStorage.getItem('token');
    let currentHeaders = this.headers;
    if (token) {
      currentHeaders = currentHeaders.set('Authorization', `Bearer ${token}`);
    }

    return this.http.get<any>(`${this.baseUrl}/notificaciones`, {
      headers: currentHeaders
    }).pipe(
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

  /**
   * Marca una notificación como leída y actualiza el estado
   */  
  marcarLeidaYActualizar(id: number): void {
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) return;

    this.http.put(`${this.baseUrl}/notificaciones/${id}/leer`, {}, {
      headers: this.headers
    }).subscribe({
      next: () => {
        // Actualizar localmente
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

  /**
   * Marca todas como leídas y actualiza el estado
   */  
  marcarTodasLeidasYActualizar(): void {
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) return;

    this.http.put(`${this.baseUrl}/notificaciones/leer-todas`, {}, {
      headers: this.headers
    }).subscribe({
      next: () => {
        // Actualizar localmente
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
