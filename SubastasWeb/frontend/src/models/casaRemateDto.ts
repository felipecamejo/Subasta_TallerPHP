import { rematadorDto } from './rematadorDto';
import { subastaDto } from './subastaDto';

export interface casaRemateDto {
    id : number;
    nombre: string;
    idFiscal: string;
    email: string;
    telefono: string;
    calificacion: Array<number>;
    latitud: number;
    longitud: number;

    rematador: Pick<rematadorDto, 'usuario' | 'matricula'>;
    subastas: Pick<subastaDto, 'id' | 'duracionMinutos' | 'fecha' | 'nombre'>[];
}
