import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UrlService } from './url.service';
import { pujaDto } from '../models/pujaDto';

interface PujaRequest {
  fechaHora: string;
  montoTotal: number;
  cliente_id: number | null;
  lote_id: number;
}

@Injectable({
  providedIn: 'root',
})
export class PujaService {

  private endpoint: string = '/pujas';

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
  ) {}

  crearPuja(puja: PujaRequest): Observable<pujaDto> {
    return this.http.post<pujaDto>(`${this.urlService.baseUrl}${this.endpoint}`, puja);
  }
}
