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



}
