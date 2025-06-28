import { rematadorDto } from './rematadorDto';
import { subastaDto } from './subastaDto';
import { usuarioDto } from './usuarioDto';
import { vendedorDto } from './vendedorDto';
import { valoracionDto } from './valoracionDto';

export interface casaRemateDto {
    usuario_id: number | null; // ID del usuario, puede ser null si no se ha asignado
    idFiscal: string;
    usuario: usuarioDto | null;           // Datos personales del usuario
    vendedor?: vendedorDto;        // Vendedor asociado (opcional)
    rematadores: rematadorDto[];   // Lista de rematadores
    subastas: Pick<subastaDto, 'id' | 'duracionMinutos' | 'fecha' | 'nombre' | 'activa'>[]; // Subastas resumidas
    valoracion: Pick<valoracionDto, 'id' | 'valoracion_total' | 'cantidad_opiniones' | 'valorable_type' | 'valorable_id'> | null;

}

// Para crear/actualizar una casa de remate
export interface CreateCasaRemateDto {
    idFiscal: string;
    usuario_id: number;     // ID del usuario ya creado
    vendedor_id?: number;   // ID del vendedor (opcional)
}

// Para listar casas de remate (vista resumida)
export interface CasaRemateListItemDto {
    usuario_id: number;
    idFiscal: string;
    calificacion: number;
    usuario: Pick<usuarioDto, 'nombre' | 'email'>;
    cantidad_subastas: number;
}
