import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { UrlService } from './url.service';



@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private baseUrl: string;
  
  private contadorSubject = new BehaviorSubject<number>(0);

  
  public contador$ = this.contadorSubject.asObservable();  constructor(
    private http: HttpClient,
    private urlService: UrlService,
   
  ) {
    this.baseUrl = this.urlService.baseUrl;
    
    // Actualizar notificaciones cada 30 segundos solo si está autenticado
    interval(30000).subscribe(() => {
   
    });
  }
  /**
   * Inicializa el servicio cargando las notificaciones solo si está autenticado
   */
  inicializar(): void {
    
  }
  /**
   * Obtiene las notificaciones del usuario actual
   */
  

  /**
   * Cuenta las notificaciones no leídas
   */

  /**
   * Marca una notificación como leída
   */

  /**
   * Marca todas las notificaciones como leídas
   */
   /**
   * Actualiza el estado de las notificaciones solo si está autenticado
   */
  

  /**
   * Fuerza una actualización de las notificaciones solo si está autenticado
   */
 
  /**
   * Marca una notificación como leída y actualiza el estado
   */
 

  /**
   * Marca todas como leídas y actualiza el estado
   */
 
}
