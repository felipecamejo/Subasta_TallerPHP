import { rematadorDto } from './rematadorDto';
import { subastaDto } from './subastaDto';
import { valoracionDto } from './valoracionDto';

export interface casaRemateDto {
    id : number | null;
    nombre: string;
    idFiscal: string;
    email: string;
    telefono: string;
    latitud: number;
    longitud: number;

    rematadores: Pick<rematadorDto, 'usuario' | 'matricula'>[];
    subastas: Pick<subastaDto, 'id' | 'duracionMinutos' | 'fecha' | 'nombre'>[];
    valoracion: Pick<valoracionDto, 'id' | 'valoracion_total' | 'cantidad_opiniones' | 'valorable_type' | 'valorable_id'> | null;
}
