import { articuloDto } from './articuloDto.js';

export interface categoriaDto {
    nombre: string;
    categoria_padre_id: number | null;
    
    articulo: Pick<articuloDto, 'id' | 'nombre'>;
    categoria_hija: Pick<categoriaDto, 'nombre' | 'categoria_padre_id'>[];
    categoria_padre: Pick<categoriaDto, 'nombre' | 'categoria_padre_id'>;
}
