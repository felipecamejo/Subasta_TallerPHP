import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UrlService } from './url.service';
import { categoriaDto } from '../models/categoriaDto';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {

  private endpoint: string = '/categorias';

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
  ) {}

  getCategorias(): Observable<categoriaDto[]> {
    return this.http.get<categoriaDto[]>(`${this.urlService.baseUrl}${this.endpoint}`);
  }


}
