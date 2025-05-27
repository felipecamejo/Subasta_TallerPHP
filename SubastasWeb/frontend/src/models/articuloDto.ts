import { vendedorDto } from './vendedorDto.ts';
import { loteDto } from './loteDto.ts';

export interface ArticuloDto {
    id: number;
    nombre: string;
    imagen: string;
    especificacion: string;
    disponibilidad: boolean;
    condicion: string;
    vendedor: Pick<vendedorDto, 'id' | 'nombre'>;
    lote: Pick<loteDto, 'valorBase' | 'pujaMinima' | 'subasta_id'>;
}
