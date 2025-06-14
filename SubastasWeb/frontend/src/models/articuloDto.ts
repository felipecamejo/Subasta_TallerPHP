import { categoriaDto } from './categoriaDto';
import { estadoEnum } from './estadoEnum';
import { loteDto } from './loteDto';
import { vendedorDto } from './vendedorDto';

export interface articuloDto {
    id: number | null;
    nombre: string;
    imagen: string;
    especificacion: string;
    disponibilidad: boolean;
    estado: estadoEnum;
    condicion: string;
    vendedor: Pick<vendedorDto, 'id' | 'nombre'>;
    lote: Pick<loteDto, 'id' |'valorBase' | 'pujaMinima'>;
    categoria: Pick<categoriaDto, 'id' | 'nombre' | 'categoria_padre'>;
}
