import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { UrlService } from './url.service';
import { vendedorDto } from '../models/vendedorDto';

@Injectable({
  providedIn: 'root',
})
export class VendedorService {

  private endpoint: string = '/vendedores';

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
  ) {}

  getVendedores(): Observable<vendedorDto[]> {
    return this.http.get<vendedorDto[]>(`${this.urlService.baseUrl}${this.endpoint}`);
  }

  crearVendedor(vendedorData: { nombre: string }): Observable<vendedorDto> {
    return this.http.post<vendedorDto>(`${this.urlService.baseUrl}${this.endpoint}`, vendedorData);
  }

  buscarVendedorPorNombre(nombre: string): Observable<vendedorDto | null> {
    // Por ahora, obtenemos todos y filtramos localmente
    // En el futuro se puede implementar un endpoint de búsqueda en el backend
    return this.getVendedores().pipe(
      map((vendedores: vendedorDto[]) => vendedores.find((v: vendedorDto) => v.nombre.toLowerCase() === nombre.toLowerCase()) || null)
    );
  }

  crearOBuscarVendedor(nombre: string): Observable<vendedorDto> {
    return this.buscarVendedorPorNombre(nombre).pipe(
      switchMap((vendedorExistente: vendedorDto | null) => {
        if (vendedorExistente) {
          return of(vendedorExistente);
        } else {
          return this.crearVendedor({ nombre });
        }
      })
    );
  }

}
