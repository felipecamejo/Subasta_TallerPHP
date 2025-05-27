import { loteDto } from './loteDto';
import { facturaDto } from './facturaDto';
import { clienteDto } from './clienteDto';
export interface PujaDto {
    id: number;
    fechaHora: Date;
    monto: number;

    lote: Pick<loteDto, 'id' | 'nombre'>;
    factura: Pick<facturaDto, 'id' | 'numero'>;
    puja: Pick<clienteDto, 'id' | 'nombre'>;
}

