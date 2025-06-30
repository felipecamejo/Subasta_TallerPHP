import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UrlService } from './url.service';
import { articuloDto } from '../models/articuloDto';

@Injectable({
  providedIn: 'root',
})
export class ArticuloService {

  private endpoint: string = '/articulos';

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
  ) {}

  getArticulos(): Observable<articuloDto[]> {
    return this.http.get<articuloDto[]>(`${this.urlService.baseUrl}${this.endpoint}`);
  }

  crearArticulo(articuloData: any): Observable<articuloDto> {
    return this.http.post<articuloDto>(`${this.urlService.baseUrl}${this.endpoint}`, articuloData);
  }

  getArticulo(id: number): Observable<articuloDto> {
    return this.http.get<articuloDto>(`${this.urlService.baseUrl}${this.endpoint}/${id}`);
  }

  actualizarArticulo(id: number, articuloData: any): Observable<articuloDto> {
    return this.http.put<articuloDto>(`${this.urlService.baseUrl}${this.endpoint}/${id}`, articuloData);
  }

  eliminarArticulo(id: number): Observable<any> {
    return this.http.delete(`${this.urlService.baseUrl}${this.endpoint}/${id}`);
  }

}
