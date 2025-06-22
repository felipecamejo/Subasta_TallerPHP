import { adminBaseUsuarioDto } from './adminBaseUsuarioDto';

export interface adminRematadorDto extends adminBaseUsuarioDto {
  matricula: string;
  calificacion: number;
}