import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UrlService } from './url.service';
import { pujaDto } from '../models/pujaDto';

@Injectable({
  providedIn: 'root',
})
export class PujaService {

  private endpoint: string = '/pujas';

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
  ) {}

  getPujaslote(id : number): Observable<pujaDto[]> {
    return this.http.get<pujaDto[]>(`${this.urlService.baseUrl}${this.endpoint}/pujasLote/${id}`);
  }

  crearPuja(puja : any): Observable<pujaDto> {
    return this.http.post<pujaDto>(`${this.urlService.baseUrl}${this.endpoint}`, puja);
  }
}
