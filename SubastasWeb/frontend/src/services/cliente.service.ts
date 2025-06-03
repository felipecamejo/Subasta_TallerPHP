import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from './url.service';
import { clienteDto } from '../models/clienteDto';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private endpoint: string = '/clientes';

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
  ) {}

  crearCliente(cliente: clienteDto): Observable<string> {
    return this.http.post<string>(`${this.urlService.baseUrl}${this.endpoint}/crear`, cliente);
  }

  seleccionarCliente(id: number): Observable<clienteDto> {
    return this.http.get<clienteDto>(`${this.urlService.baseUrl}${this.endpoint}/${id}`);
  }

  editarCliente(cliente: clienteDto): Observable<string> {
    return this.http.put<string>(`${this.urlService.baseUrl}${this.endpoint}/${cliente.usuario_id}/editar`, cliente);
  }

  eliminarCliente(id: number): Observable<string> {
    return this.http.put<string>(`${this.urlService.baseUrl}${this.endpoint}/${id}/eliminar`, {});
  }

  listarClientes(): Observable<{clientes: clienteDto[]}> {
    return this.http.get<{clientes: clienteDto[]}>(`${this.urlService.baseUrl}${this.endpoint}/listar`);
  }
}