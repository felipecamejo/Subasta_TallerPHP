import { facturaDto } from './facturaDto';
import { casaRemateDto } from './casaRemateDto';
import { articuloDto } from './articuloDto';

export interface vendedorDto {
    id: number;
    nombre: string;

    factura: Pick<facturaDto, 'id' | 'montoTotal' | 'condicionesDePago' | 'entrega'>[];

    casaremate: Pick<casaRemateDto, 'id' | 'nombre'>[]; // Update this line to only use valid keys from casaRemateDto

    articulo: Pick<articuloDto, 'id' | 'nombre'>[];

}