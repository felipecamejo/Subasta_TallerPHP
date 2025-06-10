import { subastaDto } from "./subastaDto";
import { pujaDto } from "./pujaDto";
import { articuloDto } from "./articuloDto";

export interface loteDto {
    id: number | null;
    valorBase: number;
    pujaMinima: number;
    umbral: number;
    subasta: Pick<subastaDto, 'id' | 'fecha' | 'duracionMinutos'| 'nombre'>;
    pujas: Pick<pujaDto, 'id' | 'fechaHora' | 'monto' >[];
    articulos: Pick<articuloDto, 'id' | 'nombre' | 'imagen'| 'categoria' | 'estado'>[];
}   