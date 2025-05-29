
import { pujaDto } from './pujaDto';
import { casaRemateDto } from './casaRemateDto';
import { rematadorDto } from './rematadorDto';

export interface subastaDto {
    id: number;
    nombre: string;
    activa: boolean;
    duracionMinutos: number;
    fecha: Date;
    longitud: number;
    latitud: number;

    puja: Pick<pujaDto, 'id' | 'fechaHora' | 'monto' >[];

    casaremate: Pick<casaRemateDto, 'id' | 'nombre'>;

    rematador: Pick<rematadorDto, 'usuario'>;
}

