import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UrlService } from './url.service';
import { Observable, tap, catchError } from 'rxjs';
import { facturaDto } from '../models/facturaDto';

@Injectable({
  providedIn: 'root'
})

export class FacturaService {
  private endpoint: string = '/facturas';

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
  ) {}

  crearFactura(factura: facturaDto): Observable<facturaDto> {
    const url = `${this.urlService.baseUrl}${this.endpoint}`;
    console.log('🌐 FACTURA SERVICE: Enviando POST a', url);
    console.log('📋 FACTURA SERVICE: Datos enviados:', factura);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<facturaDto>(url, factura, { headers }).pipe(
      tap(response => {
        console.log('✅ FACTURA SERVICE: Respuesta exitosa:', response);
      }),
      catchError(error => {
        console.error('❌ FACTURA SERVICE: Error en la petición:', error);
        console.error('❌ FACTURA SERVICE: URL:', url);
        console.error('❌ FACTURA SERVICE: Datos enviados:', factura);
        console.error('❌ FACTURA SERVICE: Headers:', headers);
        throw error;
      })
    );
  }

}
