import { loteDto } from './loteDto';
import { vendedorDto } from './vendedorDto';

export interface articuloDto {
    id: number;
    nombre: string;
    imagen: string;
    especificacion: string;
    disponibilidad: boolean;
    condicion: string;
    vendedor: Pick<vendedorDto, 'id' | 'nombre'>;
    lote: Pick<loteDto, 'id' |'valorBase' | 'pujaMinima'>;
}
