import { usuarioDto } from './usuarioDto';
import { subastaDto } from './subastaDto';
import { casaRemateDto } from './casaRemateDto';

export interface rematadorDto{
    id: number;
    matricula: string;

    // Relaciones
    usuario: Pick<usuarioDto, 'id' | 'nombre'>;
    subasta: Pick<subastaDto, 'id' | 'fecha'>[];
    casasRemate: Pick<casaRemateDto, 'id' | 'nombre'>[];

}