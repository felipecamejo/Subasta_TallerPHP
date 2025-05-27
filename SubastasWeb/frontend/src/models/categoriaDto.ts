import { ArticuloDto } from './articuloDto.js';

export interface CategoriaDto {
    nombre: string;
    categoria_padre_id: number;
    
    articulo: Pick<ArticuloDto, 'id' | 'nombre'>;
    categoria_hija: Pick<CategoriaDto, 'nombre' | 'categoria_padre_id'>[];
    categoria_padre: Pick<CategoriaDto, 'nombre' | 'categoria_padre_id'>;
}
