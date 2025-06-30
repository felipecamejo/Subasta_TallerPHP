import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UrlService } from './url.service';
import { loteDto } from '../models/loteDto';
import { SubastaService } from './subasta.service';

@Injectable({
  providedIn: 'root',
})
export class LoteService {

  private endpoint: string = '/lotes';

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
    private subastaService: SubastaService
  ) {}

  getLotes(): Observable<loteDto[]> {
    return this.http.get<loteDto[]>(`${this.urlService.baseUrl}${this.endpoint}`);
  }

  crearLote(loteData: any): Observable<loteDto> {
    return this.http.post<loteDto>(`${this.urlService.baseUrl}${this.endpoint}`, loteData);
  }

  getLotesPorSubasta(subastaId: number): Observable<Pick<loteDto, 'id' | 'valorBase' | 'pujaMinima' | 'pujas' | 'articulos' | 'umbral'| 'pago'>[]> {
    // Obtenemos la subasta completa con sus lotes incluidos
    return this.subastaService.getSubasta(subastaId).pipe(
      map(subasta => subasta.lotes || [])
    );
  }

}
