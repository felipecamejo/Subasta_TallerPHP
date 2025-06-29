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
  
  getClienteMail(clienteId: number | null): Observable<string | null> {
    if (!clienteId) {
      return of(null);
    }
    return this.http.get<clienteDto>(`${this.urlService.baseUrl}/clientes/${clienteId}`).pipe(
      map(cliente => cliente.usuario?.email || null),
      catchError(error => {
        console.error('Error al obtener cliente:', error);
        return of(null);
      })
    );
  }
}

