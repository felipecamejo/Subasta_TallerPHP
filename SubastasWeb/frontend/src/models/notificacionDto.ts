import { clienteDto } from './clienteDto';

export interface notificacionDto {
  id: number;
  titulo: string;
  mensaje: string;
  fechaHora: Date;
}

export interface notificacionUsuarioDto {
  id: number;
  leido: boolean;
  titulo: string;
  mensaje: string;
  fechaHora: Date;
  usuario: {
    id: number;
    nombre: string;
  };
}