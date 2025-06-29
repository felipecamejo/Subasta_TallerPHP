export interface valoracionDto {
    id: number | null;
    total_puntaje: number;
    cantidad_opiniones: number;
    valorable_id: number;
    created_at?: string;
    updated_at?: string;
    promedio?: number; // Calculado
    estrellas?: number; // Calculado
}
