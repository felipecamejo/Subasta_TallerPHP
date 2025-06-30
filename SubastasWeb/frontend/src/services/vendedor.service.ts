import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
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
    console.log('🔄 Llamando API vendedores:', `${this.urlService.baseUrl}${this.endpoint}`);
    
    return this.http.get<vendedorDto[]>(`${this.urlService.baseUrl}${this.endpoint}`).pipe(
      map((response: any) => {
        console.log('📡 Respuesta raw de vendedores:', response);
        
        // Verificar si la respuesta es un array
        if (Array.isArray(response)) {
          console.log('✅ Respuesta es array con', response.length, 'elementos');
          return response as vendedorDto[];
        } else {
          console.log('⚠️ Respuesta no es array, intentando extraer data...');
          // Si viene encapsulado en un objeto con propiedad data
          if (response && response.data && Array.isArray(response.data)) {
            console.log('✅ Encontrado array en response.data');
            return response.data as vendedorDto[];
          } else {
            console.error('❌ Formato de respuesta inesperado:', response);
            return [];
          }
        }
      }),
      catchError((error) => {
        console.error('❌ Error en getVendedores:', error);
        // Retornar array vacío en caso de error para no romper la aplicación
        return of([]);
      })
    );
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
