import { articuloDto } from './articuloDto.js';

export interface categoriaDto {
    id: number | null;
    nombre: string;
    
    articulos: Pick<articuloDto, 'id' | 'nombre'>;
    categoria_hijas: Pick<categoriaDto, 'id' |'nombre' | 'categoria_padre'>[] | null;
    categoria_padre: Pick<categoriaDto,  'id' | 'nombre' | 'categoria_padre'> | null;
}
