import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { casaRemateDto } from '../models/casaRemateDto';
import { UrlService } from './url.service';

@Injectable({
  providedIn: 'root'
})
export class CasaRematesService {
  private endpoint: string = '/casa-remates';

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
  ) {}

  getCasaRemates(): Observable<casaRemateDto[]> {
    return this.http.get<casaRemateDto[]>(`${this.urlService.baseUrl}${this.endpoint}`);
  }

  getCasaRematesPorId(id: number): Observable<casaRemateDto> {
    return this.http.get<casaRemateDto>(`${this.urlService.baseUrl}${this.endpoint}/${id}`);
  }

  postCrearCasaRemates(data: casaRemateDto): Observable<casaRemateDto> {
    return this.http.post<casaRemateDto>(`${this.urlService.baseUrl}${this.endpoint}`, data);
  }

  putActualizarCasaRemates(data: casaRemateDto): Observable<casaRemateDto> {
    return this.http.put<casaRemateDto>(`${this.urlService.baseUrl}${this.endpoint}/${data.usuario_id}`, data);
  }
}
