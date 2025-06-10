import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UrlService } from './url.service';
import { Observable } from 'rxjs';
import { casaRemateDto } from '../models/casaRemateDto';

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

  getCasaRematesPorId(id: number): Observable<casaRemateDto[]> {
    return this.http.get<casaRemateDto[]>(`${this.urlService.baseUrl}${this.endpoint}/${id}`);
  }

  postCrearCasaRemates(x: casaRemateDto): Observable<casaRemateDto> {
    return this.http.post<casaRemateDto>(`${this.urlService.baseUrl}${this.endpoint}`, x);
  }

  putActualizarCasaRemates(x: casaRemateDto): Observable<casaRemateDto> {
    return this.http.put<casaRemateDto>(`${this.urlService.baseUrl}${this.endpoint}`, x);
  }

  deleteCasaRemates(id: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.urlService.baseUrl}${this.endpoint}/${id}`);
  }

  asociarRematadores(idCasaRemate: number, rematadores: number[]): Observable<any> {
    const url = `${this.urlService.baseUrl}${this.endpoint}/${idCasaRemate}/asociar-rematadores`;
    return this.http.post<any>(url, { rematadores });
  }

  calificarCasaRemate(idCasaRemate: number, calificacion: number): Observable<any> {
    const url = `${this.urlService.baseUrl}${this.endpoint}/${idCasaRemate}/calificar`;
    return this.http.post<any>(url, { calificacion });
  }


}
