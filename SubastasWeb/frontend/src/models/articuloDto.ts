import { categoriaDto } from './categoriaDto';
import { loteDto } from './loteDto';
import { vendedorDto } from './vendedorDto';

export interface articuloDto {
    id: number | null;
    nombre: string;
    imagen: string;
    especificacion: string;
    disponibilidad: boolean;
    condicion: string;
    vendedor: Pick<vendedorDto, 'id' | 'nombre'>;
    lote: Pick<loteDto, 'id' |'valorBase' | 'pujaMinima'>;
    categorias: Pick<categoriaDto, 'id' | 'nombre'>[];
}
