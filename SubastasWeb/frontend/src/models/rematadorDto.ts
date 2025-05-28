import { usuarioDto } from './usuarioDto';
import { subastaDto } from './subastaDto';
import { casaRemateDto } from './casaRemateDto';

export interface rematadorDto{
    matricula: string;

    // Relaciones
    usuario: Pick<usuarioDto, 'id' | 'nombre'>;
    subasta: Pick<subastaDto, 'id' | 'fecha' | 'nombre'>[];
    casasRemate: Pick<casaRemateDto, 'id' | 'nombre'>[];

}