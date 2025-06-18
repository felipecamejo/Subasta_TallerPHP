import { facturaDto } from './facturaDto';
import { casaRemateDto } from './casaRemateDto';
import { articuloDto } from './articuloDto';

export interface vendedorDto {
    id: number | null;
    
    nombre: string;

    factura: Pick<facturaDto, 'id' | 'montoTotal' | 'condicionesDePago' | 'entrega'>[];

    casaremate: Pick<casaRemateDto, 'usuario_id' | 'usuario' | 'idFiscal' >[];

    articulo: Pick<articuloDto, 'id' | 'nombre'>[];

}