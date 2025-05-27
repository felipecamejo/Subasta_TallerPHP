
import { pujaDto } from './pujaDto';
import { casaRemateDto } from './casaRemateDto';
import { rematadorDto } from './rematadorDto';

export interface SubastaDto {
    id: number;
    duracionMinutos: number;
    fecha: Date;
    longitud: number;

    puja: Pick<pujaDto, 'id' | 'fechaHora' | 'monto' >[];

    casaremate: Pick<casaRemateDto, 'id' | 'nombre'>;

    rematador: Pick<rematadorDto, 'id' | 'nombre'>;
}

