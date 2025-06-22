import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './../environments/environment';
import { Observable } from 'rxjs';

import { adminCasaRemateDto } from '../models/adminCasaRemateDto';
import { adminUsuarioDto } from '../models/adminUsuarioDto';
import { PaginacionRespuesta } from '../models/paginacionRespuesta';

@Injectable({ providedIn: 'root' })
export class AdminUsuariosService {
  private baseUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  // Casas de remate aprobadas (paginado)
  getCasasAprobadas(page: number = 1): Observable<PaginacionRespuesta<adminCasaRemateDto>> {
    return this.http.get<PaginacionRespuesta<adminCasaRemateDto>>(
      `${this.baseUrl}/casas-aprobadas?page=${page}`
    );
  }

  desaprobarCasa(usuario_id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/desaprobar-casa/${usuario_id}`, {});
  }

  // Casas de remate pendientes (paginado)
  getCasasPendientes(page: number = 1): Observable<PaginacionRespuesta<adminCasaRemateDto>> {
    return this.http.get<PaginacionRespuesta<adminCasaRemateDto>>(
      `${this.baseUrl}/usuarios-pendientes?page=${page}`
    );
  }

  aprobarCasa(usuario_id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/aprobar-casa/${usuario_id}`, {});
  }

  // Usuarios por rol (cliente, rematador, casa_remate)
  obtenerUsuariosPorRol(
    rol: string,
    page: number = 1
  ): Observable<PaginacionRespuesta<adminUsuarioDto>> {
    return this.http.get<PaginacionRespuesta<adminUsuarioDto>>(
      `${this.baseUrl}/usuarios-por-rol?rol=${rol}&page=${page}`
    );
  }

  eliminarUsuario(usuarioId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/eliminar-usuario/${usuarioId}`);
  }

  // Futuro: Banear usuario
  banearUsuario(usuarioId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/banear/${usuarioId}`, {});
  }
}
