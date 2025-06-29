
    import { usuarioDto } from "./usuarioDto";
import { pujaDto } from "./pujaDto";
import { notificacionDto } from "./notificacionDto";
import { valoracionDto } from "./valoracionDto";

export interface clienteDto {
    usuario_id: number;
    usuario: Pick<usuarioDto, 'id' | 'nombre' | 'imagen' | 'email'> & 
             Partial<Pick<usuarioDto, 'telefono' | 'cedula' | 'latitud' | 'longitud'>>;
    pujas: Pick<pujaDto, 'id' | 'fechaHora'| 'monto'>[];
    notificaciones: Pick<notificacionDto, 'id' | 'mensaje'>[];
    valoracion: Pick<valoracionDto, 'id' | 'valoracion_total' | 'cantidad_opiniones' | 'valorable_type' | 'valorable_id'> | null;
} 