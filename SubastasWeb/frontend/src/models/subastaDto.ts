
import { pujaDto } from './pujaDto';
import { casaRemateDto } from './casaRemateDto';
import { rematadorDto } from './rematadorDto';
import { loteDto } from './loteDto';

export interface subastaDto {
    id: number;
    nombre: string;
    activa: boolean;
    duracionMinutos: number;
    fecha: Date;
    longitud: number;
    latitud: number;

    lotes: Pick<loteDto, 'id' | 'valorBase' | 'pujaMinima' | 'pujas' >[];

    casaremate: Pick<casaRemateDto, 'id' | 'nombre'>;

    rematador: Pick<rematadorDto, 'usuario'>;
}

