import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { UrlService } from './url.service';
import { notificacionUsuarioDto } from '../models/notificacionDto';

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
    // Por el momento no necesitamos estas configuraciones
    this.baseUrl = '';
    this.headers = new HttpHeaders();
    // Iniciamos la actualización automática de todas formas para mantener el comportamiento
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
  private obtenerNotificaciones(): Observable<notificacionUsuarioDto[]> {
    // Temporalmente usamos datos mock mientras se arregla el backend
    const notificacionesMock: notificacionUsuarioDto[] = [
      {
        id: 1,
        titulo: 'Bienvenido al sistema',
        mensaje: '¡Gracias por unirte a nuestro sistema de subastas!',
        fechaHora: new Date(),
        leido: false,
        usuario: {
          id: 1,
          nombre: 'Usuario'
        }
      },
      {
        id: 2,
        titulo: 'Nueva subasta disponible',
        mensaje: 'Se ha publicado una nueva subasta que podría interesarte',
        fechaHora: new Date(Date.now() - 3600000), // 1 hora atrás
        leido: true,
        usuario: {
          id: 1,
          nombre: 'Usuario'
        }
      }
    ];
    
    return of(notificacionesMock);
  }

  private contarNoLeidas(notificaciones: notificacionUsuarioDto[]): number {
    return notificaciones.filter(n => !n.leido).length;
  }

  /**
   * Marca una notificación como leída y actualiza el estado
   */  marcarLeidaYActualizar(id: number): void {
    // Temporalmente actualizamos los datos mock
    const notificaciones = this.notificacionesSubject.value;
    const notificacion = notificaciones.find(n => n.id === id);
    if (notificacion) {
      notificacion.leido = true;
      this.notificacionesSubject.next(notificaciones);
      this.contadorSubject.next(this.contarNoLeidas(notificaciones));
    }
  }

  /**
   * Marca todas como leídas y actualiza el estado
   */  marcarTodasLeidasYActualizar(): void {
    // Temporalmente actualizamos los datos mock
    const notificaciones = this.notificacionesSubject.value;
    notificaciones.forEach(n => n.leido = true);
    this.notificacionesSubject.next(notificaciones);
    this.contadorSubject.next(0);
  }

  destruir(): void {
    if (this.actualizacionAutomaticaInterval) {
      this.actualizacionAutomaticaInterval.unsubscribe();
    }
  }
}
