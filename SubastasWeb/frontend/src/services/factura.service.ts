import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UrlService } from './url.service';
import { Observable } from 'rxjs';
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
    return this.http.post<facturaDto>(`${this.urlService.baseUrl}${this.endpoint}`, factura);
  }

}
