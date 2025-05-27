import { rematadorDto } from './rematadorDto';
import { SubastaDto } from './subastaDto';

export interface casaRemateDto {
    nombre: string;
    idFiscal: string;
    email: string;
    telefono: string;
    calificacion: Array<number>;
    latitud: number;
    longitud: number;

    rematador: Pick<rematadorDto, 'id' | 'nombre'>;
    subastas: Pick<SubastaDto, 'nombre' | 'telefono' | 'credito'>[];
}
