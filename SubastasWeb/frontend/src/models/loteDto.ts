import { subastaDto } from "./subastaDto";

export interface loteDto {
    id: number;
    valorBase: number;
    pujaMinima: number;
    subasta: Pick<subastaDto, 'id' | 'nombre' | 'telefono'>;
}   