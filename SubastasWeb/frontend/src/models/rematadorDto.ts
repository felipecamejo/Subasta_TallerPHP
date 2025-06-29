import { usuarioDto } from './usuarioDto';
import { subastaDto } from './subastaDto';
import { casaRemateDto } from './casaRemateDto';

export interface rematadorDto{
    usuario_id: number;
    matricula: string;

    // Relaciones
    usuario: Pick<usuarioDto, 'id' | 'nombre' | 'imagen' | 'email' | 'telefono' | 'cedula' | 'latitud' | 'longitud'>;
    subasta: Pick<subastaDto, 'id' | 'fecha' | 'nombre'>[];
    casasRemate: Pick<casaRemateDto, 'usuario_id' | 'usuario'>[];

}