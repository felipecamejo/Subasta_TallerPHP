
import { pujaDto } from './pujaDto';
import { casaRemateDto } from './casaRemateDto';
import { rematadorDto } from './rematadorDto';
import { loteDto } from './loteDto';

export interface subastaDto {
    id: number | null;
    nombre: string;
    activa: boolean;
    duracionMinutos: number;
    fecha: Date;
    longitud: number;
    latitud: number;
    videoId: string | null;
    loteIndex: number;

    lotes: Pick<loteDto, 'id' | 'valorBase' | 'pujaMinima' | 'pujas' | 'articulos'>[];

    casaremate: Pick<casaRemateDto, 'id' | 'nombre'>;

    rematador: Pick<rematadorDto, 'usuario'>;
}

