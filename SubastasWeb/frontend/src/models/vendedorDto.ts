import { facturaDto } from './facturaDto';
import { casaRemateDto } from './casaRemateDto';
import { articuloDto } from './articuloDto';

export interface vendedorDto {
    id: number;
    nombre: string;

    factura: Pick<facturaDto, 'id' | 'numero'>[];

    casaremate: Pick<casaRemateDto, 'id' | 'nombre'>[];

    articulo: Pick<articuloDto, 'id' | 'nombre'>[];

}