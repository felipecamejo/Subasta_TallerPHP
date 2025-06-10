import { clienteDto } from './clienteDto';

export interface notificacionDto {
  id: number | null;
  titulo: string;
  mensaje: string;
  fechaHora: Date;
}

export interface notificacionUsuarioDto {
  id: number | null;
  leido: boolean;
  titulo: string;
  mensaje: string;
  fechaHora: Date;
  usuario: {
    id: number | null;
    nombre: string | null;
  };
}