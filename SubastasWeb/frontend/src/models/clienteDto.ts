
    import { usuarioDto } from "./usuarioDto";
    import { pujaDto } from "./pujaDto";
    import { notificacionDto } from "./notificacionDto";
    
    export interface clienteDto {
        usuario: Pick<usuarioDto, 'id' | 'nombre'> 
        calificacion: number;
        pujas: Pick<pujaDto, 'id' | 'fechaHora'| 'monto'>[];
        notificaciones: Pick<notificacionDto, 'id' | 'mensaje'>[];
    } 