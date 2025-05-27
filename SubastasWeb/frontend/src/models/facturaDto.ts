import { VendedorDto } from './VendedorDto';
import { PujaDto } from './PujaDto';

export interface FacturaDto {
    montoTotal: number;
    condicionesDePago: string;
    entrega: string;
    vendedor_id: number;
    
    vendedor: Pick<VendedorDto, 'id' | 'nombre'>;
    puja: Pick<PujaDto, 'fechaHora' | 'monto'>;
}


