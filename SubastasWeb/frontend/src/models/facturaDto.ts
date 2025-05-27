
import { pujaDto } from "./pujaDto";
import { vendedorDto } from "./vendedorDto";

export interface facturaDto {
    id: number;
    montoTotal: number;
    condicionesDePago: string;
    entrega: string;
    vendedor_id: number;
    
    vendedor: Pick<vendedorDto, 'id' | 'nombre'>;
    puja: Pick<pujaDto, 'id' | 'fechaHora' | 'monto'>;
}


