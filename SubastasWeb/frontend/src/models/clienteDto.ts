
    import { usuarioDto } from "./usuarioDto";
    import { pujaDto } from "./pujaDto";
    import { notificacionDto } from "./notificacionDto";
    
    export interface clienteDto {
        usuario_id: number;
        usuario: Pick<usuarioDto, 'id' | 'nombre' | 'imagen' | 'email'>;
        calificacion: number;
        pujas: Pick<pujaDto, 'id' | 'fechaHora'| 'monto'>[];
        notificaciones: Pick<notificacionDto, 'id' | 'mensaje'>[];
    } 