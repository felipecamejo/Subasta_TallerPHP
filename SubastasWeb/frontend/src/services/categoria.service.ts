import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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

  crearCategoria(categoriaData: { nombre: string; categoria_padre_id?: number | null }): Observable<categoriaDto> {
    return this.http.post<categoriaDto>(`${this.urlService.baseUrl}${this.endpoint}`, categoriaData);
  }

  buscarCategoriaPorNombre(nombre: string): Observable<categoriaDto | null> {
    // Por ahora, obtenemos todas y filtramos localmente
    // En el futuro se puede implementar un endpoint de búsqueda en el backend
    return this.getCategorias().pipe(
      map((categorias: categoriaDto[]) => categorias.find((c: categoriaDto) => c.nombre.toLowerCase() === nombre.toLowerCase()) || null)
    );
  }

  crearOBuscarCategoria(nombre: string): Observable<categoriaDto> {
    return this.buscarCategoriaPorNombre(nombre).pipe(
      switchMap((categoriaExistente: categoriaDto | null) => {
        if (categoriaExistente) {
          return of(categoriaExistente);
        } else {
          return this.crearCategoria({ nombre, categoria_padre_id: null });
        }
      })
    );
  }

}
