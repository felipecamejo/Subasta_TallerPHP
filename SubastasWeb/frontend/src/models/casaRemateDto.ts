import { rematadorDto } from './rematadorDto';
import { subastaDto } from './subastaDto';
import { usuarioDto } from './usuarioDto';
import { vendedorDto } from './vendedorDto';

export interface casaRemateDto {
    usuario_id: number;
    idFiscal: string;
    calificacion: number;          // Promedio de calificaciones
    calificaciones: number[];      // Array de calificaciones individuales
    usuario: usuarioDto;           // Datos personales del usuario
    vendedor?: vendedorDto;        // Vendedor asociado (opcional)
    rematadores: rematadorDto[];   // Lista de rematadores
    subastas: Pick<subastaDto, 'id' | 'duracionMinutos' | 'fecha' | 'nombre' | 'activa'>[]; // Subastas resumidas
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
