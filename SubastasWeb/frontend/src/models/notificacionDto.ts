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
  esMensajeChat?: boolean;
  chatId?: string;
  usuario: {
    id: number | null;
    nombre: string | null;
  };
}