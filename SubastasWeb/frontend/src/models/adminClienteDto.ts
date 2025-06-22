import { adminBaseUsuarioDto } from './adminBaseUsuarioDto';

export interface adminClienteDto extends adminBaseUsuarioDto {
  direccion: string;
}