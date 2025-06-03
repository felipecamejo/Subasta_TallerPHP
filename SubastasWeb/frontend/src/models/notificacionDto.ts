import { clienteDto } from './clienteDto';

export interface notificacionDto{
    
    id: number | null;
    mensaje: string;

    cliente: Pick<clienteDto, 'usuario'>[];
}