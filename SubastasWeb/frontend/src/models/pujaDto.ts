import { loteDto } from './loteDto';
import { facturaDto } from './facturaDto';
import { clienteDto } from './clienteDto';


export interface pujaDto {
    id: number;
    fechaHora: Date;
    monto: number;

    lote: Pick<loteDto, 'id' |'valorBase' | 'pujaMinima'>;
    factura: Pick<facturaDto, 'id' | 'montoTotal' | 'entrega'>;
    puja: Pick<clienteDto, 'usuario'>;
}

