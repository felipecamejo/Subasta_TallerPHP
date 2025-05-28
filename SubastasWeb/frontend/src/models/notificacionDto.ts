import { clienteDto } from './clienteDto';

export interface notificacionDto{
    
    id: number;
    mensaje: string;

    cliente: Pick<clienteDto, 'usuario'>[];
}