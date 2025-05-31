import { subastaDto } from "./subastaDto";
import { pujaDto } from "./pujaDto";

export interface loteDto {
    id: number;
    valorBase: number;
    pujaMinima: number;
    subasta: Pick<subastaDto, 'id' | 'fecha' | 'duracionMinutos'| 'nombre'>;
    pujas: Pick<pujaDto, 'id' | 'fechaHora' | 'monto' >[];
}   