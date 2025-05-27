
//import { CreditoDto } from './credito.dto';
//import { EntidadDto } from './entidad.dto';

export interface SubastaDto {
    id: number;
    nombre: string;
    telefono: string;
    credito: Pick<CreditoDto, 'id' | 'precioTotal' | 'pagoHastaAhora' | 'ventas'>;
}
