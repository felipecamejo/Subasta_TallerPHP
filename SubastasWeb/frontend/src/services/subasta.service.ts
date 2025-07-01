import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UrlService } from './url.service';
import { subastaDto } from '../models/subastaDto';
import { clienteDto } from '../models/clienteDto';
import { mailDto } from '../models/mailDto';

@Injectable({
  providedIn: 'root',
})
export class SubastaService {

  private endpoint: string = '/subastas';

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
  ) {}

  getSubasta(id: number): Observable<subastaDto> {
    return this.http.get<subastaDto>(`${this.urlService.baseUrl}${this.endpoint}/${id}`);
  }

  updateSubasta(subasta: subastaDto): Observable<subastaDto> {
    return this.http.put<subastaDto>(
      `${this.urlService.baseUrl}${this.endpoint}/${subasta.id}`,
      subasta
    );
  }

  getSubastas(): Observable<subastaDto[]> {
    return this.http.get<subastaDto[]>(`${this.urlService.baseUrl}${this.endpoint}`);
  }

  enviarMail(mail : mailDto): Observable<any> {
    console.log('DEBUG enviarMail payload:', mail); // DEBUG
    return this.http.post<any>(`${this.urlService.baseUrl}/subastas/enviarMail`, mail);
  }

  // Método para crear subasta con zona horaria
  createSubasta(subasta: any, timezone: string): Observable<subastaDto> {
    const subastaConZona = {
      ...subasta,
      timezone: timezone // Enviar zona horaria del usuario
    };
    return this.http.post<subastaDto>(`${this.urlService.baseUrl}${this.endpoint}`, subastaConZona);
  }

  // Método para crear subasta usando la nueva API
  crearSubasta(subastaData: any): Observable<subastaDto> {
    return this.http.post<subastaDto>(`${this.urlService.baseUrl}${this.endpoint}`, subastaData);
  }
  
  getClienteMail(clienteId: number | null): Observable<string | null> {
    if (!clienteId) {
      return of(null);
    }
    // El endpoint /usuarioEmail/{id} devuelve un string plano (el email), no un objeto
    return this.http.get(`${this.urlService.baseUrl}/usuarioEmail/${clienteId}`, { responseType: 'text' }).pipe(
      map(email => email || null),
      catchError(error => {
        console.error('Error al obtener email del cliente:', error);
        return of(null);
      })
    );
  }

  // Si querés buscar usuario por email, usá este método aparte
  getUsuarioPorEmail(email: string): Observable<string | null> {
    return this.http.get<string>(`${this.urlService.baseUrl}/buscar-usuario-email/${email}`).pipe(
      catchError(error => {
        console.error('Error al buscar usuario por email:', error);
        return of(null);
      })
    );
  }

  // Método para obtener ganadores de la subasta
  obtenerGanadores(subastaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlService.baseUrl}${this.endpoint}/${subastaId}/ganadores`).pipe(
      catchError(error => {
        console.error('Error al obtener ganadores:', error);
        return of([]);
      })
    );
  }
}

