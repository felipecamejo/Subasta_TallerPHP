import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UrlService } from './url.service';
import { subastaDto } from '../models/subastaDto';

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
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<subastaDto>(`${this.urlService.baseUrl}${this.endpoint}/${id}` , { params });
  }


}
