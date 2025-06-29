import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from './url.service';
import { rematadorDto } from '../models/rematadorDto';

@Injectable({
  providedIn: 'root',
})
export class RematadorService {
  private endpoint: string = '/rematadores';

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
  ) {}

  crearRematador(rematador: rematadorDto): Observable<string> {
    return this.http.post<string>(`${this.urlService.baseUrl}${this.endpoint}/crear`, rematador);
  }

  seleccionarRematador(id: number): Observable<rematadorDto> {
    return this.http.get<rematadorDto>(`${this.urlService.baseUrl}${this.endpoint}/${id}`);
  }

  editarRematador(rematador: rematadorDto): Observable<string> {
    return this.http.put<string>(`${this.urlService.baseUrl}${this.endpoint}/${rematador.usuario_id}/editar`, rematador);
  }

  eliminarRematador(id: number): Observable<string> {
    return this.http.put<string>(`${this.urlService.baseUrl}${this.endpoint}/${id}/eliminar`, {});
  }

  listarRematadores(): Observable<{rematadores: rematadorDto[]}> {
    return this.http.get<{rematadores: rematadorDto[]}>(`${this.urlService.baseUrl}${this.endpoint}/listar`);
  }
}