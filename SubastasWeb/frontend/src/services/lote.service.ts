import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UrlService } from './url.service';
import { loteDto } from '../models/loteDto';

@Injectable({
  providedIn: 'root',
})
export class LoteService {

  private endpoint: string = '/lotes';

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
  ) {}

  getLotes(): Observable<loteDto> {
    return this.http.get<loteDto>(`${this.urlService.baseUrl}${this.endpoint}`);
  }


}
