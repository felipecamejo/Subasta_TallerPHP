import { adminBaseUsuarioDto } from './adminBaseUsuarioDto';

export interface adminCasaRemateDto extends adminBaseUsuarioDto {
  id_fiscal: string;
  aprobada: boolean;
}
