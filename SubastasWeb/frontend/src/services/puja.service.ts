import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UrlService } from './url.service';
import { pujaDto } from '../models/pujaDto';

// ✅ Nueva interfaz para Redis (más simple)
interface PujaRedisRequest {
  cliente_id: number | null;
  monto: number;
}

// 🔄 Interfaz antigua para compatibilidad
interface PujaRequest {
  fechaHora: string;
  monto: number;
  cliente_id: number | null;
  lote_id: number;
}

@Injectable({
  providedIn: 'root',
})
export class PujaService {

  private endpoint: string = '/pujas';
  private redisEndpoint: string = '/pujas-redis'; // ✅ Nuevo endpoint Redis

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
  ) {}

  // 🚀 NUEVO: Método para pujas con Redis (RECOMENDADO)
  crearPujaRedis(loteId: number, puja: PujaRedisRequest): Observable<any> {
    return this.http.post<any>(`${this.urlService.baseUrl}${this.redisEndpoint}/${loteId}/pujar`, puja);
  }

  // 🆕 NUEVO: Obtener puja actual desde Redis
  obtenerPujaActual(loteId: number): Observable<any> {
    return this.http.get<any>(`${this.urlService.baseUrl}${this.redisEndpoint}/${loteId}/actual`);
  }

  // 🆕 NUEVO: Obtener historial de pujas desde Redis
  obtenerHistorialPujas(loteId: number): Observable<any> {
    return this.http.get<any>(`${this.urlService.baseUrl}${this.redisEndpoint}/${loteId}/historial`);
  }

  // 🆕 NUEVO: Obtener estadísticas en tiempo real
  obtenerEstadisticas(loteId: number): Observable<any> {
    return this.http.get<any>(`${this.urlService.baseUrl}${this.redisEndpoint}/${loteId}/estadisticas`);
  }

  // 🆕 NUEVO: Marcar que usuario está viendo
  marcarVisualizacion(loteId: number, usuarioId: number): Observable<any> {
    return this.http.post<any>(`${this.urlService.baseUrl}${this.redisEndpoint}/${loteId}/visualizacion`, { usuario_id: usuarioId });
  }

  // 🔄 ANTIGUO: Método tradicional (mantener para compatibilidad)
  crearPuja(puja: PujaRequest): Observable<pujaDto> {
    return this.http.post<pujaDto>(`${this.urlService.baseUrl}${this.endpoint}`, puja);
  }
}
