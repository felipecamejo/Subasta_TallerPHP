import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UrlService } from './url.service';
import { SubastaDto } from '../models/subastaDto';

@Injectable({
  providedIn: 'root',
})
export class SubastaService {

  private endpoint: string = '/entidad';

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
  ) {}

  getCliente(id: number): Observable<SubastaDto> {
      const params = new HttpParams().set('id', id.toString());
      return this.http.get<SubastaDto>(`${this.urlService.baseUrl}${this.endpoint}/seleccionarCliente`, { params });
  }


}
